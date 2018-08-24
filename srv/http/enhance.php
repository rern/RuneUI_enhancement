<?php
// redis  : command = { dataid: [ 'command', 'key', ['hash',] 'value' ] }
// volume : N ... mute/unmute: N = -1 )
// mpd    : mpd protocol command

if ( isset( $_POST[ 'redis' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$array = json_decode( $_POST[ 'redis' ], true );
	foreach ( $array as $field => $arg ) {
		$count = count( $arg );
		$command = $arg[ 0 ];
		if ( in_array( $command, [ 'hGetAll', 'hmSet', 'set' ] ) ) $pushstream = 1;
		
		if ( $count === 2 ) {
			$result[ $field ] = $redis->$command( $arg[ 1 ] );
		} else if ( $count === 3 ) {
			$result[ $field ] = $redis->$command( $arg[ 1 ], $arg[ 2 ] );
			if ( $arg[ 2 ] === 'activePlayer' && $result[ $field ] === 'Airplay' ) $airplay = 1;
		} else if ( $count === 4 ) {
			$result[ $field ] = $redis->$command( $arg[ 1 ], $arg[ 2 ], $arg[ 3 ] );
		}
	}
	echo json_encode( $result );
	
	// broadcast to all clients on hmSet display or set volume
	if ( !isset( $pushstream ) ) die();
	
	$result[ 'display' ] = $redis->hGetAll( 'display' );
	if ( isset( $airplay ) ) $result[ 'actplayerinfo' ] = $redis->get( 'act_player_info' );
	$ch = curl_init( 'http://localhost/pub?id=display' );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( $result ) );
	curl_exec( $ch );
	curl_close( $ch );
} else if ( isset( $_POST[ 'volume' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	// normal
	$volume = $_POST[ 'volume' ];
	if ( $volume != -1 ) {
		exec( 'mpc volume '.$volume );
		$redis->set( 'volumemute', 0 );
		die();
	}
	// mute / unmute
	$volumemute = $redis->get( 'volumemute' );
	if ( $volumemute == 0 ) {
		$currentvol = exec( "mpc volume | cut -d' ' -f2 | cut -d'%' -f1" );
		$redis->set( 'volumemute', $currentvol );
		exec( 'mpc volume 0' );
		echo $currentvol;
	} else {
		exec( 'mpc volume '.$volumemute );
		$redis->set( 'volumemute', 0 );
		echo $volumemute;
	}
} else if ( isset( $_POST[ 'mpd' ] ) ) {
	include '/srv/http/app/libs/runeaudio.php';
	$mpd = openMpdSocket('/run/mpd.sock');
	sendMpdCommand( $mpd, $_POST[ 'mpd' ] );
	$result = readMpdResponse( $mpd );
	echo $result;
	if ( isset( $_POST[ 'pushstream' ] ) ) {
		$data = isset( $_POST[ 'getdata' ] ) ? $result : 1;
		ui_render( $_POST[ 'pushstream' ], $data );
	}
} else if ( isset( $_POST[ 'bash' ] ) ) {
	$result = shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	echo $result;
}
