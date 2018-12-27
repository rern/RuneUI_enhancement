<?php
// with redis
$redis = new Redis();
$redis->pconnect( '127.0.0.1' );

if ( isset( $_POST[ 'bash' ] ) ) {
	echo shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	exit();
} else if ( isset( $_POST[ 'album' ] ) ) {
	$albums = shell_exec( $_POST[ 'album' ] );
	$name = isset( $_POST[ 'albumname' ] ) ? $_POST[ 'albumname' ] : '';
	if ( isset( $_POST[ 'albumname' ] ) ) {
		$type = 'album';
		$name = $_POST[ 'albumname' ];
	} else if ( isset( $_POST[ 'genrename' ] ) ) {
		$type = 'genre';
		$name = $_POST[ 'genrename' ];
	} else {
		$name = '';
	}
	$lines = explode( "\n", rtrim( $albums ) );
	$count = count( $lines );
	if ( $count === 1 ) {
		$albums = shell_exec( 'mpc find -f "%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%" '.$type.' "'.$name.'"' );
		$data = search2array( $albums );
		if ( $redis->hGet( 'display', 'coverfile' ) && !isPlaylist( $data ) ) {
			$cover = getCover( $data );
			if ( $cover ) $data[][ 'coverart' ] = $cover;
		}
	} else {
		foreach( $lines as $line ) {
			$list = explode( '^^', $line );
			if ( $name ) {
				$li[ 'artistalbum' ] = $list[ 1 ].'<gr> • </gr>'.$list[ 0 ]; // album: artist - album
			} else {
				$li[ 'artistalbum' ] = $list[ 0 ].'<gr> • </gr>'.$list[ 1 ]; // genre: album - artist
			}
			$li[ 'album' ] = $list[ 0 ];
			$li[ 'artist' ] = $list[ 1 ];
			$data[] = $li;
			$li = '';
		}
	}
	echo json_encode( $data );
	exit();
} else if ( isset( $_POST[ 'mpc' ] ) ) {
	$mpc = $_POST[ 'mpc' ];
	if ( !is_array( $mpc ) ) { // multiples commands is array
		if ( loadCue( $mpc ) ) exit();
		
		$result = shell_exec( $mpc );
		// query 'various artist album' with 'artist name' > requery without
		if ( !$result ) {
			$result = shell_exec( 'mpc find -f "%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%" album "'.$_POST[ 'name' ].'"' );
		}
		$cmd = $mpc;
	} else {
		foreach( $mpc as $cmd ) {
			if ( loadCue( $cmd ) ) {
				$loadCue = 1;
				continue;
			}
			$result = shell_exec( $cmd );
		}
		if ( isset( $loadCue ) ) exit();
	}
	$cmdpl = explode( ' ', $cmd )[ 1 ];
	if ( $cmdpl === 'save' || $cmdpl === 'rm' ) {
		$data = lsPlaylists();
		pushstream( 'playlist', $data );
	}
	if ( isset( $_POST[ 'list' ] ) ) {
		if ( !$result ) {
			echo 0;
			exit();
		}
		$type = $_POST[ 'list' ];
		if ( $type === 'file' ) {
			$data = search2array( $result );
			if ( $redis->hGet( 'display', 'coverfile' ) && !isPlaylist( $data ) && substr( $mpc, 0, 10 ) !== 'mpc search' ) {
				$cover = getCover( $data );
				if ( $cover ) $data[][ 'coverart' ] = $cover;
			}
		} else {
			$lists = explode( "\n", rtrim( $result ) );
			foreach( $lists as $list ) {
				$data[] = array( $type => $list );
			}
		}
		echo json_encode( $data );
	} else if ( isset( $_POST[ 'result' ] ) ) {
		echo $result;
	}
	exit();
} else if ( isset( $_POST[ 'playlist' ] ) ) {
	$path = $_POST[ 'playlist' ];
	if ( !is_array( $path ) ) {
		$ext = substr( $path, -3 );
		if ( $ext === 'm3u' ) {
			$file = '/mnt/MPD/'.$path;
			exec( '/usr/bin/sudo /usr/bin/ln -s "'.$file.'" /var/lib/mpd/playlists/' );
			$lines = shell_exec( 'mpc -f "%title%^^%time%^^[##%track% • ][%artist%][ • %album%]^^%file%^^[%albumartist%|%artist%]^^%album%^^%genre%^^%composer%" playlist "'.basename( $file, '.m3u' ).'"' );
			exec( '/usr/bin/sudo /usr/bin/rm "/var/lib/mpd/playlists/'.basename( $file ).'"' );
		} else {
			$lines = shell_exec( 'mpc -f "%title%^^%time%^^[##%track% • ][%artist%][ • %album%]^^%file%^^[%albumartist%|%artist%]^^%album%^^%genre%^^%composer%" playlist "'.$path.'"' );
		}
	} else {
		$lines = '';
		foreach( $path as $cue ) {
			$cuefile = preg_replace( '/([&\[\]])/', '#$1', $cue ); // escape literal &, [, ] in %file% (operation characters)
			$lines.= shell_exec( 'mpc -f "%title%^^%time%^^[##%track% • ][%artist%][ • %album%]^^%file%+cue^^[%albumartist%|%artist%]^^%album%^^%genre%^^%composer%^^'.$cuefile.'" playlist "'.$cue.'"' );
		}
		$path = dirname( $path[ 0 ] );
	}
	$data = list2array( $lines );
	$data[][ 'path' ] = $path;
	if ( $redis->hGet( 'display', 'coverfile' ) ) {
		$cover = getCover( $data );
		if ( $cover ) $data[][ 'coverart' ] = $cover;
	}
	echo json_encode( $data );
	exit();
}

if ( isset( $_POST[ 'getdisplay' ] ) ) {
	usleep( 100000 ); // !important - get data must wait connection start at least (0.05s)
	$data = $redis->hGetAll( 'display' );
	$data[ 'volumempd' ] = $redis->get( 'volume' );
	if ( isset( $_POST[ 'data' ] ) ) echo json_encode( $data, JSON_NUMERIC_CHECK );
	// suppress initial page load on other devices
	if ( !isset( $_POST[ 'onload' ] ) ) pushstream( 'display', $data );
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
	$lines = shell_exec( 'mpc -f "%title%^^%time%^^[##%track% • ][%artist%][ • %album%]^^%file%^^[%albumartist%|%artist%]^^%album%^^%genre%^^%composer%" playlist '.$name );
	if ( !isset( $_POST[ 'name' ] ) ) $data[ 'lsplaylists' ] = lsplaylists();
	if ( !$lines ) {
		$data[ 'playlist' ] = '';
	} else {
		$webradioname = array_flip( $redis->hGetAll( 'webradios' ) );
		$playlist = list2array( $lines, $webradioname );
		$data[ 'playlist' ] = $playlist;
	}
	echo json_encode( $data );
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
	$mode = $_POST[ 'power' ];
	$sudo = '/usr/bin/sudo /usr/bin/';
	if ( file_exists( '/root/gpiooff.py' ) ) $cmd.= '/usr/bin/sudo /root/gpiooff.py;';
	if ( $redis->get( local_browser ) === '1' ) $cmd .= $sudo.'killall Xorg; /usr/local/bin/ply-image /srv/http/assets/img/bootsplash.png;';
	$cmd.= $sudo.'umount -f -a -t cifs nfs -l;';
	if ( $mode !== 'screenoff' ) {
		if ( $mode === 'reboot' ) {
			// dual boot
			exec( $sudo.'mount | grep -q mmcblk0p8 && echo 8 > /sys/module/bcm2709/parameters/reboot_part' );
			$cmd.= $sudo.'shutdown -r now';
		} else {
			$cmd.= $sudo.'shutdown -h now';
		}
	} else {
		$cmd.= $sudo.'export DISPLAY=:0; xset dpms force off';
	}
	exec( $cmd );
}
function search2array( $result, $playlist = '' ) {
	$lists = explode( "\n", rtrim( $result ) );
	$genre = $composer = $albumartist = '';
	foreach( $lists as $list ) {
		$root = substr( $list, 0, 4 );
		if ( $root === 'USB/' || $root === 'NAS/' || substr( $list, 0, 13 ) === 'LocalStorage/' ) {
			$ext = substr( $list, -4 );
			if ( $ext === '.cue' || $ext === '.m3u' || $ext === '.pls' ) {
				$li[ 'playlist' ] = basename( $list );
				$li[ 'filepl' ] = $list;
				$data[] = $li;
				$li = '';
			} else {
				$data[] = array( 'directory' => $list );
			}
		} else {
			$list = explode( '^^', rtrim( $list ) );
			$li[ 'Title' ] = $list[ 0 ];
			$li[ 'Time' ] = $list[ 1 ];
			$li[ 'Artist' ] = $list[ 2 ];
			$li[ 'Album' ] = $list[ 3 ];
			$li[ 'file' ] = $list[ 4 ];
			if ( !$genre ) {
				if ( $list[ 5 ] !== '' ) $genre = $list[ 5 ];
			} else {
				if ( $list[ 5 ] !== $genre ) $genre = -1;
			}
			if ( !$composer && $list[ 6 ] !== '' ) $composer = $list[ 6 ];
			if ( !$albumartist && $list[ 7 ] !== '' ) $albumartist = $list[ 7 ];
			$data[] = $li;
			$li = '';
		}
	}
	$data[][ 'artist' ] = $data[ 0 ][ 'Artist' ];
	$data[][ 'album' ] = $data[ 0 ][ 'Album' ];
	$data[][ 'albumartist' ] = $albumartist ?: $data[ 0 ][ 'Artist' ];
	if ( $genre ) $data[][ 'genre' ] = $genre;
	if ( $composer ) $data[][ 'composer' ] = $composer;
	return $data;
}
function list2array( $result, $webradioname = null ) {
	$lists = explode( "\n", rtrim( $result ) );
	$artist = $album = $genre = $composer = $albumartist = $file = '';
	foreach( $lists as $list ) {
		$list = explode( '^^', rtrim( $list ) );
		$li[ 'Title' ] = $list[ 0 ] ? $list[ 0 ] : $webradioname[ $list[ 3 ] ];
		if ( !$li[ 'Title' ] ) continue; // skip *.cue
		
		$li[ 'Time' ] = $list[ 1 ];
		$li[ 'track' ] = $list[ 2 ];
		$li[ 'file' ] = $list[ 3 ];
		if ( $li[ 'file' ] !== $file ) {
			$file = $li[ 'file' ];
			$i = 1;
		}
		$li[ 'index' ] = $i++;
		if ( !$artist && $list[ 4 ] !== '' ) $artist = $list[ 4 ];
		if ( !$album && $list[ 5 ] !== '' ) $album = $list[ 5 ];
		if ( !$genre ) {
			if ( $list[ 6 ] !== '' ) $genre = $list[ 6 ];
		} else {
			if ( $list[ 6 ] !== $genre ) $genre = -1;
		}
		if ( !$composer && $list[ 7 ] !== '' ) $composer = $list[ 7 ];
		if ( isset( $list[ 8 ] ) ) $li[ 'cue' ] = $list[ 8 ];
		$data[] = $li;
		$li = '';
	}
	$data[][ 'artist' ] = $artist;
	$data[][ 'album' ] = $album;
	$data[][ 'albumartist' ] = $albumartist ?: $data[ 0 ][ 'Artist' ];
	if ( $genre ) $data[][ 'genre' ] = $genre;
	if ( $composer ) $data[][ 'composer' ] = $composer;
	return $data;
}
function loadCue( $mpc ) { // 'mpc ls "path" | mpc add' from enhancecontext.js
	if ( substr( $mpc, 0, 8 ) !== 'mpc ls "' ) return;
	
	$ls = chop( $mpc, ' | mpc add' );
	$result = shell_exec( $ls );
	$lists = explode( "\n", rtrim( $result ) );
	$cuefiles = preg_grep( '/.cue$/', $lists );
	if ( count( $cuefiles ) ) {
		asort( $cuefiles );
		foreach( $cuefiles as $cue ) {
			shell_exec( 'mpc load "'.$cue.'" | mpc add' );
		}
		return 1;
	}
}
function isPlaylist( $data ) {
	foreach( $data as $list ) {
		if ( array_key_exists( 'playlist', $list ) ) {
			return 1;
		}
	}
}
function getCover( $data ) {
	$file = '/mnt/MPD/'.$data[ 0 ][ 'file' ];
	$dir = dirname( $file );
	$coverfiles = array(
		  'cover.png', 'cover.jpg', 'folder.png', 'folder.jpg', 'front.png', 'front.jpg'
		, 'Cover.png', 'Cover.jpg', 'Folder.png', 'Folder.jpg', 'Front.png', 'Front.jpg'
	);
	foreach( $coverfiles as $cover ) {
		$coverfile = $dir.'/'.$cover;
		if ( file_exists( $coverfile ) ) {
			$coverext = pathinfo( $cover, PATHINFO_EXTENSION );
			$coverart = file_get_contents( $coverfile ) ;
			return 'data:image/'. $coverext.';base64,'.base64_encode( $coverart );
		}
	}
	set_include_path( '/srv/http/app/libs/vendor/' );
	require_once( 'getid3/audioinfo.class.php' );
	$audioinfo = new AudioInfo();
	$id3tag = $audioinfo->Info( $file );
	if ( isset( $id3tag[ 'comments' ][ 'picture' ][ 0 ][ 'data' ] ) ) {
		$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
		$coverart = $id3cover[ 'data' ];
		$coverext = str_replace( 'image/', '', $id3cover[ 'image_mime' ] );
		return 'data:image/'. $coverext.';base64,'.base64_encode( $coverart );
	}
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
		, 'albumartist'  => $count[ 3 ]
		, 'composer'     => $count[ 4 ]
		, 'genre'        => $count[ 5 ]
		, 'nas'          => $count[ 6 ]
		, 'usb'          => $count[ 7 ]
		, 'webradio'     => $count[ 8 ]
		, 'spotify'      => $count[ 9 ]
		, 'activeplayer' => $count[ 10 ]
	);
	return $status;
}
function lsPlaylists() {
	$lines = shell_exec( 'mpc lsplaylists' );
	if ( $lines ) {
		$lists = explode( "\n", rtrim( $lines ) );
		foreach( $lists as $list ) {
			$lsplaylists[] = $list;
		}
		return $lsplaylists;
	} else {
		return 0;
	}
}
