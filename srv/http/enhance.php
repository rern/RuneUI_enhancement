<?php
//   mpc    : { mpc: command }  // multiples commands must be array
//   volume : N ... mute/unmute: N = -1 )

function pushstream( $channel, $data = 1 ) {
	$ch = curl_init( 'http://localhost/pub?id='.$channel );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( $data, JSON_NUMERIC_CHECK ) );
	curl_exec( $ch );
	curl_close( $ch );
}

if ( isset( $_POST[ 'mpdmonitor' ] ) ) {
	$cmd = '
		while : ; do
			mpc idle player
			curl -s -v -X POST "http://localhost/pub?id=playback" -d 1
		done > /dev/null &';
	exec( $cmd );
} else if ( isset( $_POST[ 'getdisplay' ] ) ) {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	usleep( 100000 ); // !important - get data must wait at least 50000
	pushstream( 'display', $redis->hGetAll( 'display' ) );
} else if ( isset( $_POST[ 'setdisplay' ] ) ) {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	$data = $_POST[ 'setdisplay' ];
	$redis->hmSet( 'display', $data );
	pushstream( 'display', $data );
} else if ( isset( $_POST[ 'library' ] ) ) {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	$sd = exec( 'mpc list title base LocalStorage | wc -l' );
	$network = exec( 'df | grep "/mnt/MPD/NAS" | wc -l' );
	$usb = exec( 'df | grep "/mnt/MPD/USB" | wc -l' );
	$webradio = count( $redis->hKeys( 'webradios' ) );
	$activeplayer = $redis->get( 'activePlayer' );
	$rbkmarks = $redis->hGetAll( 'bkmarks' );
	foreach ( $rbkmarks as $name => $path ) {
		$bookmarks[] = array(
			  'name'  => $name
			, 'path'  => $path
			, 'count' => exec( 'mpc list title base "'.$path.'" | wc -l' )
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
	pushstream( 'playback' );
} else if ( isset( $_POST[ 'mpc' ] ) ) {
	$mpc = $_POST[ 'mpc' ];
	if ( !is_array( $mpc ) ) {
		$result = shell_exec( 'mpc '.$mpc );
	} else {
		foreach( $mpc as $cmd ) {
			$result = shell_exec( 'mpc '.$cmd );
		}
	}
	echo $result;
	$data = isset( $_POST[ 'getresult' ] ) ? $result : 1;
	if ( $mpc === 'clear' ) $data = 'clear';
	if ( isset( $_POST[ 'pushstream' ] ) ) pushstream( $_POST[ 'pushstream' ], $data );
} else if ( isset( $_POST[ 'mpd' ] ) ) {
	$data = shell_exec( '{ sleep 0.01; echo '.$_POST[ 'mpd' ].'; sleep 0.01; } | telnet localhost 6600 | grep "'.$_POST[ 'filter' ].'" | cut -d" " -f2' );
	echo $data;
} else if ( isset( $_POST[ 'getplaylist' ] ) ) {
	$lines = shell_exec( '{ sleep 0.01; echo playlistinfo; sleep 0.01; } | telnet localhost 6600 | grep "^Title\|^Time\|^Track\|^Artist\|^Album\|^file"' );
	$lists = explode( 'file: ', $lines );
	foreach( $lists as $lines ) {
		$line = strtok( $lines, "\n" );
		$list[ 'file' ] = $line;
		$line = strtok( "\n" );
		while ( $line !== false ) {
			$pair = explode( ': ', $line, 2 );
			$key = $pair[ 0 ];
			$val = $pair[ 1 ];
			$list[ $key ] = $val;
			$line = strtok( "\n" );
			if ( $line === false ) {
				$data[] = $list;
				$list = [];
			}
		}
	}
	//echo json_encode( $data, JSON_NUMERIC_CHECK );
	pushstream( 'playlist', $data );
} else if ( isset( $_POST[ 'bkmarks' ] ) || isset( $_POST[ 'webradios' ] ) ) {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	if ( isset( $_POST[ 'bkmarks' ] ) ) {
		$key = 'bkmarks';
		$data = $_POST[ 'bkmarks' ];
	} else {
		$key = 'webradios';
		$data = $_POST[ 'webradios' ];
	}
	echo $key.' '.$data;
	if ( !is_array( $data ) ) {
		$redis->hDel( $key, $data );
		if ( $key === 'webradios' ) unlink( '/mnt/MPD/Webradio/'.$data.'.pls' );
	} else {
		$name = $data[ 0 ];
		$value = $data[ 1 ];
		if ( count( $data ) === 3 ) $redis->hDel( $key, $data[ 2 ] );
		$redis->hSet( $key, $name, $value );
		if ( $key === 'webradios' ) {
			$lines = '[playlist]
					NumberOfEntries=1
					File1='.$value.'
					Title1='.$name;
			$fopen = fopen( '/mnt/MPD/Webradio/'.$name.'.pls', 'w');
			fwrite( $fopen, $lines );
			fclose( $fopen );
		}
	}
	if ( $key === 'webradios' ) exec( 'mpc update Webradio' );
	pushstream( 'library', 1 );
} else if ( isset( $_POST[ 'radio' ] ) ) {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	$radio = $_POST[ 'radio' ];
	$redis->hSet('webradios', $data->label, $data->url);
	if ( is_array( $bkmark ) ) {
		$redis->hSet( 'bkmarks', $bkmark[ 0 ], $bkmark[ 1 ] );
	} else {
		$redis->hDel( 'bkmarks', $bkmark );
	}
	pushstream( 'library', 1 );
} else if ( isset( $_POST[ 'power' ] ) ) {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	$sudo = '/usr/bin/sudo /usr/bin/';
	if ( file_exists( '/root/gpiooff.py' ) ) $cmd.= '/usr/bin/sudo /root/gpiooff.py;';
	if ( $redis->get( local_browser ) === '1' ) $cmd .= $sudo.'killall Xorg; /usr/local/bin/ply-image /srv/http/assets/img/bootsplash.png;';
	$cmd.= $sudo.'umount -f -a -t cifs nfs -l;';
	$cmd.= $sudo.'shutdown '.( $_POST[ 'power' ] === 'reboot' ? '-r' : '-h' ).' now';
	exec( $cmd );
} else if ( isset( $_POST[ 'hddspinup' ] ) ) { // wake up usb hdd
	exec( '/usr/bin/sudo /usr/bin/fdisk -l' );
}