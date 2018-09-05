<?php
// js syntax:
//   redis  : { dataid: [ 'command', 'key', ['hash',] 'value' ] }
//   volume : N ... mute/unmute: N = -1 )
//   mpd    : { mpd: command }  // mpd protocol command - multiples commands must be array

function refreshUI( $channel, $data = 1 ) {
	$ch = curl_init( 'http://localhost/pub?id='.$channel );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( $data, JSON_NUMERIC_CHECK ) );
	curl_exec( $ch );
	curl_close( $ch );
}

if ( isset( $_POST[ 'getdisplay' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	usleep( 100000 ); // !important - get data must wait at least 50000
	refreshUI( 'display', $redis->hGetAll( 'display' ) );
} else if ( isset( $_POST[ 'setdisplay' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$data = $_POST[ 'setdisplay' ];
	$redis->hmSet( 'display', $data );
	refreshUI( 'display', $data );
} else if ( isset( $_POST[ 'volume' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$volume = $_POST[ 'volume' ];
	$volumemute = $redis->hGet( 'display', 'volumemute' );
	if ( $volume == '-1' ) {
		if ( $volumemute == 0 ) {
			$currentvol = exec( "mpc volume | tr -d ' %' | cut -d':' -f2" );
			$vol = 0;
		} else {
			$currentvol = 0;
			$vol = $volumemute;
		}
	} else {
		$currentvol = 0;
		$vol = $volume;
	}
	$redis->hSet( 'display', 'volumemute', $currentvol );
	exec( 'mpc volume '.$vol );
	refreshUI( 'playback' );
} else if ( isset( $_POST[ 'mpd' ] ) ) {
	$mpd = $_POST[ 'mpd' ];
	if ( !is_array( $mpd ) ) {
		$result = shell_exec( 'mpc '.$mpd );
	} else {
		foreach( $mpd as $cmd ) {
			$result = shell_exec( 'mpc '.$cmd );
		}
	}
	if ( isset( $_POST[ 'pushstream' ] ) ) refreshUI( $_POST[ 'pushstream' ], 1 );
	if ( isset( $_POST[ 'getresult' ] ) ) echo $result;
} else if ( isset( $_POST[ 'library' ] ) ) {
	echo exec( '/srv/http/enhancelibdata.sh' );
} else if ( isset( $_POST[ 'bash' ] ) ) {
	$result = shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	echo $result;
} else if ( isset( $_POST[ 'power' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$sudo = '/usr/bin/sudo /usr/bin/';
	if ( file_exists( '/root/gpiooff.py' ) ) $cmd.= '/usr/bin/sudo /root/gpiooff.py;';
	if ( $redis->get( local_browser ) === '1' ) $cmd .= $sudo.'killall Xorg; /usr/local/bin/ply-image /srv/http/assets/img/bootsplash.png;';
	$cmd.= $sudo.'umount -f -a -t cifs nfs -l;';
	$cmd.= $sudo.'shutdown '.( $_POST[ 'power' ] === 'reboot' ? '-r' : '-h' ).' now';
	exec( $cmd );
}
