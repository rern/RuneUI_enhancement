<?php
// json: command = { dataid: [ 'command', 'key', ['hash',] 'value' ] }
// bash: command = { dataid: [ '/fullpath/command argument' ] }
// { volume: N } ( mute/unmute: N = -1 )
//
// $.post( '/enhanceredis.php', { JSON.stringify( command ) }, ...

// single bash
if ( isset( $_POST[ 'bash' ] ) ) {
	$result = exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	echo $result;
	die();
}

$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

// volume
if ( isset( $_POST[ 'volume' ] ) ) {
	include( '/srv/http/app/libs/runeaudio.php' );
	$mpd = openMpdSocket('/run/mpd.sock');
// normal
	if ( $_POST[ 'volume' ] != -1 ) {
		sendMpdCommand( $mpd, 'setvol '.$_POST[ 'volume' ] );
		$redis->set( 'volumemute', 0 );
	} else {
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
	}
	die();
}


$array = json_decode( $_POST[ 'json' ], true );

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
