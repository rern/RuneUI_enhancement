<?php
// bash: command = { dataid: [ '/fullpath/command argument' ] }
// redis: command = { dataid: [ 'command', 'key', ['hash',] 'value' ] }
// { volume: N } ( mute/unmute: N = -1 )
// [no parameters] for status

// bash
if ( isset( $_POST[ 'bash' ] ) ) {
	$result = shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	echo $result;
	die();
}

$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );
$volumempd = $redis->get( 'volume' ) == 1 ? 'checked' : '';
$redis->hSet( 'display', 'volumempd', $volumempd ); // normally not in 'display'

// redis
if ( isset( $_POST[ 'redis' ] ) ) {
	$array = json_decode( $_POST[ 'redis' ], true );
	$pushstream = 0;
	foreach ( $array as $field => $arg ) {
		$count = count( $arg );
		$command = $arg[ 0 ];
		if ( in_array( $command, [ 'hGetAll', 'hmSet', 'set' ] ) ) $pushstream = 1;
		
		if ( $count === 2 ) {
			$result[ $field ] = $redis->$command( $arg[ 1 ] );
		} else if ( $count === 3 ) {
			$result[ $field ] = $redis->$command( $arg[ 1 ], $arg[ 2 ] );
			if ( $arg[ 2 ] === 'activePlayer' && $result[ $field ] === 'Airplay' ) $result[ 'actplayerinfo' ] = $redis->get( 'act_player_info' );
		} else if ( $count === 4 ) {
			$result[ $field ] = $redis->$command( $arg[ 1 ], $arg[ 2 ], $arg[ 3 ] );
		}
	}
	echo json_encode( $result );
	
	// broadcast to all clients on hmSet display or set volume
	if ( !$pushstream ) die();
	
	$result[ 'display' ] = $redis->hGetAll( 'display' );
	$ch = curl_init( 'http://localhost/pub?id=display' );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( $result ) );
	curl_exec( $ch );
	curl_close( $ch );
	
	die();
}


include '/srv/http/app/libs/runeaudio.php';
$mpd = openMpdSocket('/run/mpd.sock');

// MPD telnet command (protocol)
if ( isset( $_POST[ 'mpd' ] ) ) {
	sendMpdCommand( $mpd, $_POST[ 'mpd' ] );
	echo readMpdResponse( $mpd );
	die();
}

// volume
function status2array( $lines ) {
	$line = strtok( $lines, "\n" );
	while ( $line !== false ) {
		$pair = explode( ': ', $line, 2 );
		$key = $pair[ 0 ];
		$val = $pair[ 1 ];
		if ( $key === 'elapsed' ) {
			$val = round( $val );
		} else if ( $key === 'bitrate' ) {
			$val = $val * 1000;
		}
		if ( $key !== 'O' ) $status[ $key ] = $val; // skip 'OK' lines
		if ( $key === 'audio') {
			$audio = explode( ':', $val );
			$status[ 'bitdepth' ] = $audio[ 1 ];
			$status[ 'samplerate' ] = $audio[ 0 ];
		}
		$line = strtok( "\n" );
	}
	if ( array_key_exists( 'bitrate', $status ) ) {
		$sampling = substr( $status[ 'file' ], 0, 4 ) === 'http' ? '' : $status[ 'bitdepth' ].' bit ';
		$sampling.= round( $status[ 'samplerate' ] / 1000, 1 ).' kHz '.$status[ 'bitrate' ].' kbit/s';
		$status[ 'sampling' ] = $sampling;
	} else {
		$status[ 'sampling' ] = '&nbsp;';
	}
	return $status;
}
if ( isset( $_POST[ 'volume' ] ) ) {
	// normal
	if ( $_POST[ 'volume' ] != -1 ) {
		sendMpdCommand( $mpd, 'setvol '.$_POST[ 'volume' ] );
		$redis->set( 'volumemute', 0 );
		die();
	}
	// mute / unmute
	$volumemute = $redis->get( 'volumemute' );
	if ( $volumemute == 0 ) {
		$cmdlist = "command_list_begin\n"
			."status\n"
			."setvol 0\n"
			."command_list_end";
		sendMpdCommand( $mpd, $cmdlist );
		$status = readMpdResponse( $mpd );
		$vol = status2array( $status )[ 'volume' ];
		$redis->set( 'volumemute', $vol );
		echo $vol;
	} else {
		sendMpdCommand( $mpd, 'setvol '.$volumemute );
		$redis->set( 'volumemute', 0 );
		echo $volumemute;
	}
	die();
}
