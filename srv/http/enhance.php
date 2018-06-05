<?php
// bash: command = { dataid: [ '/fullpath/command argument' ] }
// redis: command = { dataid: [ 'command', 'key', ['hash',] 'value' ] }
// { volume: N } ( mute/unmute: N = -1 )
// [no parameters] for status

// bash
if ( isset( $_POST[ 'bash' ] ) ) {
	$result = exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	echo $result;
	die();
}

$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

// redis
if ( isset( $_POST[ 'redis' ] ) ) {
	$array = json_decode( $_POST[ 'redis' ], true );
	foreach ( $array as $field => $arg ) {
		$count = count( $arg );
		$command = $arg[ 0 ];
		$key = $arg[ 1 ];
		
		if ( $count === 2 ) {
			$result[ $field ] = $redis->$command( $key );
		} else if ( $count === 3 ) {
			$result[ $field ] = $redis->$command( $key, $arg[ 2 ] );
		} else if ( $count === 4 ) {
			$result[ $field ] = $redis->$command( $key, $arg[ 2 ], $arg[ 3 ] );
		}
	}
	echo json_encode( $result );
	die();
}


include( '/srv/http/app/libs/runeaudio.php' );
$mpd = openMpdSocket('/run/mpd.sock');

// MPD telnet command (protocol)
if ( isset( $_POST[ 'mpd' ] ) ) {
	sendMpdCommand( $mpd, $_POST[ 'mpd' ] );
	die();
}

// volume
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
		$vol = arrayLines( $status )[ 'volume' ];
		$redis->set( 'volumemute', $vol );
		echo $vol;
	} else {
		sendMpdCommand( $mpd, 'setvol '.$volumemute );
		$redis->set( 'volumemute', 0 );
		echo $volumemute;
	}
	die();
}
