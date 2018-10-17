<?php
// no redis
if ( isset( $_POST[ 'bash' ] ) ) {
	echo shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	exit();
} else if ( isset( $_POST[ 'mpcalbum' ] ) ) {
	$album = $_POST[ 'mpcalbum' ];
	$result = shell_exec( 'mpc find -f "%album%^^%artist%" album "'.$album.'" | awk \'!a[$0]++\'' );
	$lists = explode( "\n", rtrim( $result ) );
	if ( count( $lists ) === 1 ) {
		$result = shell_exec( 'mpc find -f "%title%^^%time%^^%artist%^^%album%^^%file%" album "'.$album.'"' );
		$data = search2array( $result );
	} else {
		foreach( $lists as $list ) {
			$list = explode( '^^', $list );
			$li[ 'artistalbum' ] = $list[ 1 ].'<gr> • </gr>'.$list[ 0 ];
			$li[ 'album' ] = $list[ 0 ];
			$li[ 'artist' ] = $list[ 1 ];
			$data[] = $li;
			$li = '';
		}
	}
	echo json_encode( $data );
	exit();
} else if ( isset( $_POST[ 'mpc' ] ) ) {
// 
	$mpc = $_POST[ 'mpc' ];
	if ( !is_array( $mpc ) ) { // multiples commands is array
		$result = shell_exec( $mpc );
		$cmd = $mpc;
	} else {
		foreach( $mpc as $cmd ) {
			$result = shell_exec( $cmd );
		}
	}
	$cmdpl = explode( ' ', $cmd )[ 1 ];
	if ( $cmdpl === 'save' || $cmdpl === 'rm' ) {
		$data = lsPlaylists();
		pushstream( 'playlist', $data );
	}
	if ( isset( $_POST[ 'search' ] ) ) {
		$data = search2array( $result );
		echo json_encode( $data );
	} else if ( isset( $_POST[ 'list' ] ) ) {
		$type = $_POST[ 'list' ];
		if ( $type === 'file' ) {
			$data = search2array( $result );
		} else {
			$lists = explode( "\n", rtrim( $result ) );
			foreach( $lists as $list ) {
				$data[] = array( $type => $list );
			}
		}
		echo json_encode( $data );
	} else {
		echo $result;
	}
	exit();
}

// with redis
$redis = new Redis();
$redis->pconnect( '127.0.0.1' );

if ( isset( $_POST[ 'getdisplay' ] ) ) {
	usleep( 100000 ); // !important - get data must wait connection start at least (0.05s)
	$data = $redis->hGetAll( 'display' );
	$data[ 'volumempd' ] = $redis->get( 'volume' );
	if ( isset( $_POST[ 'data' ] ) ) echo json_encode( $data, JSON_NUMERIC_CHECK );
	pushstream( 'display', $data );
} else if ( isset( $_POST[ 'setdisplay' ] ) ) {
	$data = $_POST[ 'setdisplay' ];
	$redis->hmSet( 'display', $data );
	pushstream( 'display', $data );
} else if ( isset( $_POST[ 'library' ] ) ) {
	$status = getLibrary();
	if ( isset( $_POST[ 'data' ] ) ) echo json_encode( $status, JSON_NUMERIC_CHECK );
	pushstream( 'library', $status );
} else if ( isset( $_POST[ 'volume' ] ) ) {
	$volume = $_POST[ 'volume' ];
	$volumemute = $redis->hGet( 'display', 'volumemute' );
	if ( $volume == 'setmute' ) {
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
	pushstream( 'volume', array( $vol, $currentvol ) );
} else if ( isset( $_POST[ 'getplaylist' ] ) ) {
	$name = isset( $_POST[ 'name' ] ) ? '"'.$_POST[ 'name' ].'"' : '';
	$lines = shell_exec( 'mpc -f "%title%^^%time%^^[##%track% • ]%artist%[ • %album%]^^%file%" playlist '.$name );
	if ( !$lines ) {
		echo 0;
		exit();
	}
	$webradioname = array_flip( $redis->hGetAll( 'webradios' ) );
	$lists = explode( "\n", rtrim( $lines ) );
	foreach( $lists as $list ) {
		$li = explode( '^^', $list );
		$pl[ 'title' ] = $li[ 0 ] ? $li[ 0 ] : $webradioname[ $li[ 3 ] ] ?: $li[ 3 ];
		$pl[ 'time' ] = $li[ 1 ];
		$pl[ 'track' ] = $li[ 2 ];
		$pl[ 'file' ] = $li[ 3 ];
		$playlist[] = $pl;
		$pl = '';
	}
	$data[ 'playlist' ] = $playlist;
	
	if ( !isset( $_POST[ 'name' ] ) ) {
		$data[ 'lsplaylists' ] = lsplaylists();
	}
	echo json_encode( $data, JSON_NUMERIC_CHECK );
} else if ( isset( $_POST[ 'getwebradios' ] ) ) {
	$webradios = $redis->hGetAll( 'webradios' );
	foreach( $webradios as $name => $url ) {
		$li[ 'playlist' ] = 'Webradio/'.$name.'.pls';
		$li[ 'url' ] = $url;
		$data[] = $li;
		$li = '';
	}
	echo json_encode( $data );
} else if ( isset( $_POST[ 'bkmarks' ] ) || isset( $_POST[ 'webradios' ] ) ) {
	if ( isset( $_POST[ 'bkmarks' ] ) ) {
		$key = 'bkmarks';
		$data = $_POST[ 'bkmarks' ];
	} else {
		$key = 'webradios';
		$data = $_POST[ 'webradios' ];
	}
	if ( !is_array( $data ) ) {
		$rdname = str_replace( '"', '\"', $data );
		if ( $key === 'webradios' ) {
			$redis->hDel( 'webradios', $rdname );
			$redis->hDel( 'sampling', $rdname );
			unlink( '/mnt/MPD/Webradio/'.$data.'.pls' );
		} else {
			$redis->hDel( 'bkmarks', $rdname );
		}
	} else {
		$rdname = str_replace( '"', '\"', $data[ 0 ] );
		$rdvalue = str_replace( '"', '\"', $data[ 1 ] );
		if ( count( $data ) === 3 ) {
			$rdoldname = str_replace( '"', '\"', $data[ 2 ] );
			$redis->hDel( $key, $rdoldname );
			if ( $key === 'webradios' ) unlink( '/mnt/MPD/Webradio/'.$data[ 2 ].'.pls' );
		}
		$redis->hSet( $key, $rdname, $rdvalue );
		if ( $key === 'webradios' ) {
			$lines = "[playlist]\nNumberOfEntries=1\nFile1=".$data[ 1 ]."\nTitle1=".$data[ 0 ];
			$fopen = fopen( '/mnt/MPD/Webradio/'.$data[ 0 ].'.pls', 'w');
			fwrite( $fopen, $lines );
			fclose( $fopen );
		}
	}
	if ( $key === 'bkmarks' ) {
		$status = getLibrary();
		pushstream( 'library', $status );
	} else {
		exec( 'mpc update Webradio' );
	}
} else if ( isset( $_POST[ 'homeorder' ] ) ) {
	$redis->hSet( 'display', 'library', $_POST[ 'homeorder' ] );
	$data = $redis->hGetAll( 'display' );
	pushstream( 'display', $data );
} else if ( isset( $_POST[ 'power' ] ) ) {
	$sudo = '/usr/bin/sudo /usr/bin/';
	if ( file_exists( '/root/gpiooff.py' ) ) $cmd.= '/usr/bin/sudo /root/gpiooff.py;';
	if ( $redis->get( local_browser ) === '1' ) $cmd .= $sudo.'killall Xorg; /usr/local/bin/ply-image /srv/http/assets/img/bootsplash.png;';
	$cmd.= $sudo.'umount -f -a -t cifs nfs -l;';
	$cmd.= $sudo.'shutdown '.( $_POST[ 'power' ] === 'reboot' ? '-r' : '-h' ).' now';
	exec( $cmd );
}

function search2array( $result ) {
	$lists = explode( "\n", rtrim( $result ) );
	$root = substr( $lists[ 0 ], 0, 3 );
	if ( $root === 'USB' || $root === 'NAS' || $root === 'LocalStorage' ) {
		foreach( $lists as $list ) {
			$data[] = array( 'directory' => $list );
		}
		return $data;
	}
	
	foreach( $lists as $list ) {
		$list = explode( '^^', rtrim( $list ) );
		$li[ 'Title' ] = $list[ 0 ];
		$li[ 'Time' ] = $list[ 1 ];
		$li[ 'Artist' ] = $list[ 2 ];
		$li[ 'Album' ] = $list[ 3 ];
		$li[ 'file' ] = $list[ 4 ];
		$data[] = $li;
		$li = '';
	}
	return $data;
}
function pushstream( $channel, $data = 1 ) {
	$ch = curl_init( 'http://localhost/pub?id='.$channel );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( $data, JSON_NUMERIC_CHECK ) );
	curl_exec( $ch );
	curl_close( $ch );
}
function getLibrary() {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	$rbkmarks = $redis->hGetAll( 'bkmarks' );
	if ( $rbkmarks ) {
		foreach ( $rbkmarks as $name => $path ) {
			$bookmarks[] = array(
				  'name'  => $name
				, 'path'  => $path
				, 'count' => exec( 'mpc list title base "'.$path.'" | wc -l' )
			);
		}
	} else {
		$bookmarks = 0;
	}
	$count = exec( '/srv/http/enhancecount.sh' );
	$count = explode( ' ', $count );
	$status = array( 
		  'bookmark'     => $bookmarks
		, 'artist'       => $count[ 0 ]
		, 'album'        => $count[ 1 ]
		, 'song'         => $count[ 2 ]
		, 'composer'     => $count[ 3 ]
		, 'genre'        => $count[ 4 ]
		, 'nas'          => $count[ 5 ]
		, 'usb'          => $count[ 6 ]
		, 'webradio'     => $count[ 7 ]
		, 'sd'           => $count[ 8 ]
		, 'spotify'      => $count[ 9 ]
		, 'activeplayer' => $count[ 10 ]
	);
//	echo json_encode( $status, JSON_NUMERIC_CHECK );
//	pushstream( 'library', $status );
	return $status;
}
function lsPlaylists() {
	$lines = shell_exec( 'mpc lsplaylists' );
	$lists = explode( "\n", rtrim( $lines ) );
	if ( $lists[ 0 ] ) {
		foreach( $lists as $list ) {
			$lsplaylists[] = $list;
		}
	} else {
		$lsplaylists = '';
	}
	return $lsplaylists;
}
