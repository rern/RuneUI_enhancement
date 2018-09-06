<?php
// js syntax:
//   mpd    : { mpc: command }  // multiples commands must be array
//   volume : N ... mute/unmute: N = -1 )

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
} else if ( isset( $_POST[ 'library' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$sd = exec( 'mpc list title base LocalStorage | wc -l' );
	$network = exec( 'df | grep "/mnt/MPD/NAS" | wc -l' );
	$usb = exec( 'df | grep "/mnt/MPD/USB" | wc -l' );
	$webradio = count( $redis->hKeys( 'webradios' ) );
	$activeplayer = $redis->get( 'activePlayer' );
	$rbookmarks = $redis->hGetAll( 'bookmarks' );
	foreach ( $rbookmarks as $key => $value ) {
		$data = json_decode( $value );
		$count = exec( 'mpc list title base "'.$data->path.'" | wc -l' );
		$bookmarks[] = array(
			  'id'    => $key
			, 'name'  => $data->name
			, 'path'  => $data->path
			, 'count' => $count
		);
	}
	$spotify = $redis->hGet( 'spotify', 'enable' );
	
	$types = array( 'title', 'album', 'artist', 'composer', 'genre' );
	$counts = shell_exec( 'for type in '.implode( ' ', $types ).'; do mpc list $type | awk NF | wc -l; done' );
	$counts = explode( "\n", $counts );
	array_pop( $counts ); // remove last blank
	$mpccounts = array_combine( $types, $counts );
	$data = array( 
		  'bookmarks'    => $bookmarks
		, 'sd'           => $sd
		, 'network'      => $network
		, 'usb'          => $usb
		, 'webradio'     => $webradio
		, 'spotify'      => $spotify
		, 'activeplayer' => $activeplayer
	);
	$status = array_merge( $mpccounts, $data );
	echo json_encode( $status, JSON_NUMERIC_CHECK );
} else if ( isset( $_POST[ 'bash' ] ) ) {
	echo shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
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
