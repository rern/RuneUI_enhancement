<?php
if ( isset( $_POST[ 'bash' ] ) ) {
	echo shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	exit();
}
// with redis
$redis = new Redis();
$redis->pconnect( '127.0.0.1' );

if ( isset( $_POST[ 'mpc' ] ) ) {
	$mpc = $_POST[ 'mpc' ];
	if ( !is_array( $mpc ) ) { // multiples commands is array
		if ( loadCue( $mpc ) ) exit();
		
		$result = shell_exec( $mpc );
		// query 'various artist album' with 'artist name' > requery without
		if ( !$result && isset( $_POST[ 'name' ] ) ) {
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
			if ( $redis->hGet( 'display', 'coverfile' ) && !isset( $data[ 'playlist' ] ) && substr( $mpc, 0, 10 ) !== 'mpc search' ) {
				$cover = getCover( $data[ 0 ][ 'file' ] );
				if ( $cover ) $data[][ 'coverart' ] = $cover;
			}
		} else {
			$lists = explode( "\n", rtrim( $result ) );
			foreach( $lists as $list ) {
				$sort = stripLeading( $list );
				$index[] = $sort[ 1 ];
				$data[] = array( 
					  $type    => $list
					, 'sort'   => $sort[ 0 ]
					, 'lisort' => $sort[ 1 ]
				);
			}
			$data = sortData( $data, $index );
		}
		echo json_encode( $data );
	} else if ( isset( $_POST[ 'result' ] ) ) {
		echo $result;
	}
} else if ( isset( $_POST[ 'coverartalbum' ] ) ) {
	$album = $_POST[ 'coverartalbum' ];
	$albums = shell_exec( 'mpc find -f "%album% - [%albumartist%|%artist%]" album "'.$album.'" | awk \'!a[$0]++\'' );
	$count = count( explode( "\n", rtrim( $albums ) ) );
	$cmd = 'mpc find -f "%title%^^%time%^^%artist%^^%album%^^%file%^^%genre%^^%composer%^^%albumartist%" album "'.$album.'"';
	if ( $count === 1 ) {
		$result = shell_exec( $cmd );
	} else {
		$result = shell_exec( $cmd.' albumartist "'.$_POST[ 'artist' ].'"' );
	}
	$data = search2array( $result );
	if ( $redis->hGet( 'display', 'coverfile' ) && !isset( $data[ 'playlist' ] ) && substr( $mpc, 0, 10 ) !== 'mpc search' ) {
		$cover = getCover( $data[ 0 ][ 'file' ] );
		$data[][ 'coverart' ] = $cover ?: '/assets/img/cover.svg';
	}
	echo json_encode( $data );
} else if ( isset( $_POST[ 'librarycount' ] ) ) {
	$status = getLibraryCount();
	echo json_encode( $status, JSON_NUMERIC_CHECK );
} else if ( isset( $_POST[ 'order' ] ) ) {
	$order = $_POST[ 'order' ]; 
	$redis->hSet( 'display', 'order', $order );
	$order = explode( '^^', $order );
	pushstream( 'display', array( 'order' => $order ) );
} else if ( isset( $_POST[ 'bkmarks' ] ) || isset( $_POST[ 'webradios' ] ) ) {
	if ( isset( $_POST[ 'bkmarks' ] ) ) {
		$key = 'bkmarks';
		$data = $_POST[ 'bkmarks' ];
	} else {
		$key = 'webradios';
		$data = $_POST[ 'webradios' ];
	}
	if ( !is_array( $data ) ) {
		$name = $data;
		$redis->hDel( $key, $name );
		$path = $_POST[ 'thumbnail' ];
		echo '/usr/bin/sudo /usr/bin/rm "/mnt/MPD/'.$path.'/thumbnail.jpg"';
		if ( $path ) exec( '/usr/bin/sudo /usr/bin/rm "/mnt/MPD/'.$path.'/thumbnail.jpg"' );
		if ( $key === 'webradios' ) {
			$redis->hDel( 'sampling', $name );
			unlink( '/mnt/MPD/Webradio/'.$data.'.pls' );
			exec( 'mpc update Webradio &' );
			pushstream( 'webradio', array( 'name' => $name ) );
		} else {
			$order = $redis->hGet( 'display', 'order' );
			if ( $order ) {
				$order = explode( '^^', $order );           // string to array
				$index = array_search( $name, $order );     // get index
				unset( $order[ $index ] );                  // remove
				pushstream( 'display', array( 'order' => $order ) );
				$order = implode( '^^', $order );            // array to string
				$redis->hSet( 'display', 'order', $order ); // redis cannot save array
			}
			$data = getBookmark( $redis );
			pushstream( 'bookmark', $data );
		}
		exit();
		
	} else {
		$name = $data[ 0 ];
		$value = $data[ 1 ];
		if ( isset( $data[ 2 ] ) ) {
			$oldname = $data[ 2 ];
			$redis->hDel( $key, $oldname );
			if ( $key === 'webradios' ) unlink( '/mnt/MPD/Webradio/'.$oldname.'.pls' );
		} else {
			$oldname = '';
		}
		if ( $key === 'webradios' ) {
			$redis->hSet( $key, $name, $value );
			$lines = "[playlist]\nNumberOfEntries=1\nFile1=".$value."\nTitle1=".$name;
			$fopen = fopen( '/mnt/MPD/Webradio/'.$name.'.pls', 'w');
			fwrite( $fopen, $lines );
			fclose( $fopen );
			exec( 'mpc update Webradio &' );
			pushstream( 'webradio', array( 'name' => $name, 'oldname' => $oldname ) );
			$redis->hDel( 'webradiopl', $value ); // delete from unsaved list database
			exit();
			
		} else {
			$redis->hSet( $key, $name, $value );
			$order = $redis->hGet( 'display', 'order' );
			if ( $order ) {
				$order = explode( '^^', $order );   // string to array
				if ( $oldname ) {
					$index = array_search( $oldname, $order );
					$order[ $index ] = $name;       // replace
				} else {
					array_push( $order, $name );    // append
				}
				pushstream( 'display', array( 'order' => $order ) );
				$order = implode( '^^', $order );    // array to string
				$redis->hSet( 'display', 'order', $order );
			}
		}
	}
	// coverart
	$thumbfile = '/mnt/MPD/'.$value.'/thumbnail.jpg';
	$dir = dirname( $thumbfile );
	if ( file_exists( $thumbfile ) ) { // skip if already exists
		$data = getBookmark( $redis );
		pushstream( 'bookmark', $data );
		exit();
	}
	
	// create thumbnail from coverart file
	foreach( $coverfiles as $cover ) {
		$coverfile = $dir.'/'.$cover;
		if ( file_exists( $coverfile ) ) {
			exec( '/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
			$data = getBookmark( $redis );
			pushstream( 'bookmark', $data );
			exit();
		}
	}
	
	// create thumbnail from embedded coverart
	$files = array_slice( scandir( $dir ), 2 ); // remove ., ..
	foreach( $files as $file ) {
		$file = "$dir/$file";
		if ( !is_file( $file ) ) continue;
		
		$mime = mime_content_type( $file );
		if ( strpos( $mime, 'audio' ) === 0 ) { // only audio file
			set_include_path( '/srv/http/app/libs/vendor/' );
			require_once( 'getid3/audioinfo.class.php' );
			$audioinfo = new AudioInfo();
			$id3tag = $audioinfo->Info( $file );
			if ( isset( $id3tag[ 'comments' ][ 'picture' ][ 0 ][ 'data' ] ) ) {
				$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
				$coverart = $id3cover[ 'data' ];
				$coverext = str_replace( 'image/', '', $id3cover[ 'image_mime' ] );
				$coverfile = "/srv/http/tmp/cover.$coverext";
				file_put_contents( $coverfile, $coverart );
				exec( '/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
				unlink( $coverfile );
			}
			break;
		}
	}
	$data = getBookmark( $redis );
	pushstream( 'bookmark', $data );
} else if ( isset( $_POST[ 'getwebradios' ] ) ) {
	$webradios = $redis->hGetAll( 'webradios' );
	foreach( $webradios as $name => $url ) {
		$sort = stripLeading( $name );
		$index[] = $sort[ 1 ];
		$data[] = array(
			  'playlist' => 'Webradio/'.$name.'.pls'
			, 'url'      => $url
			, 'sort'     => $sort[ 0 ]
		);
	}
	$data = sortData( $data, $index );
	echo json_encode( $data );
} else if ( isset( $_POST[ 'coverfile' ] ) ) {
	$coverfile = '/srv/http/assets/img/coverarts/'.urldecode( $_POST[ 'coverfile' ] );
	exec( '/usr/bin/sudo /usr/bin/rm "'.$coverfile.'"' );
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
		if ( $redis->hGet( 'display', 'coverfile' ) && !isset( $data[ 'playlist' ] ) ) {
			$cover = getCover( $data[ 0 ][ 'file' ] );
			if ( $cover ) $data[][ 'coverart' ] = $cover;
		}
	} else {
		foreach( $lines as $line ) {
			$list = explode( '^^', $line );
			$album = $list[ 0 ];
			$artist = $list[ 1 ];
			if ( $name ) {
				$artistalbum = $artist.'<gr> • </gr>'.$album;
				$sort = stripLeading( $artist.' - '.$album );
			} else {
				$artistalbum = $album.'<gr> • </gr>'.$artist;
				$sort = stripLeading( $album.' - '.$artist );
			}
			$index[] = $sort[ 1 ];
			$data[] = array(
				  'artistalbum' => $artistalbum
				, 'album'       => $album
				, 'artist'      => $artist
				, 'sort'        => $sort[ 0 ]
				, 'lisort'      => $sort[ 1 ]
			);
		}
		$data = sortData( $data, $index );
	}
	echo json_encode( $data );
} else if ( isset( $_POST[ 'getplaylist' ] ) ) {
	$name = isset( $_POST[ 'name' ] ) ? '"'.$_POST[ 'name' ].'"' : '';
	if ( !$name ) $data[ 'lsplaylists' ] = lsplaylists();
	$lines = shell_exec( 'mpc -f "%title%^^%time%^^[##%track% • ][%artist%][ • %album%]^^%file%^^[%albumartist%|%artist%]^^%album%^^%genre%^^%composer%" playlist '.$name );
	if ( !$lines ) {
		$data[ 'playlist' ] = '';
	} else {
		$webradios = array_flip( $redis->hGetAll( 'webradios' ) );
		$webradiopl = $redis->hGetAll( 'webradiopl' );
		$webradioname = array_merge( $webradiopl, $webradios );
		$playlist = list2array( $lines, $webradioname );
		$data[ 'playlist' ] = $playlist;
	}
	echo json_encode( $data );
} else if ( isset( $_POST[ 'playlist' ] ) ) {
	$plfiles = $_POST[ 'playlist' ];
	foreach( $plfiles as $file ) {
		$ext = pathinfo( $file, PATHINFO_EXTENSION );
		$plfile = preg_replace( '/([&\[\]])/', '#$1', $file ); // escape literal &, [, ] in %file% (operation characters)
		$lines.= shell_exec( 'mpc -f "%title%^^%time%^^[##%track% • ][%artist%][ • %album%]^^%file% + '.$ext.'^^[%albumartist%|%artist%]^^%album%^^%genre%^^%composer%^^'.$plfile.'" playlist "'.$file.'"' );
	}
	$data = list2array( $lines );
	$data[][ 'path' ] = dirname( $plfiles[ 0 ] );
	if ( $redis->hGet( 'display', 'coverfile' ) ) {
		$cover = getCover( $data[ 0 ][ 'file' ] );
		$data[][ 'coverart' ] = $cover ?: '/assets/img/cover.svg';
	}
	echo json_encode( $data );
} else if ( isset( $_POST[ 'getdisplay' ] ) ) {
	usleep( 100000 ); // !important - get data must wait connection start at least (0.05s)
	$data = $redis->hGetAll( 'display' );
	$data[ 'volumempd' ] = $redis->get( 'volume' );
	$data[ 'spotify' ] = $redis->hGet( 'spotify', 'enable' );
	if ( isset( $_POST[ 'data' ] ) ) {
		echo json_encode( $data, JSON_NUMERIC_CHECK );
	} else {
		pushstream( 'display', $data );
	}
} else if ( isset( $_POST[ 'setdisplay' ] ) ) {
	$data = $_POST[ 'setdisplay' ];
	$order = $data[ 'order' ];
	if ( is_array( $order ) ) $data[ 'order' ] = implode( ',', $order );
	$redis->hmSet( 'display', $data );
	pushstream( 'display', $data );
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
} else if ( isset( $_POST[ 'thumbfile' ] ) ) {
	$thumbfile = $_POST[ 'thumbfile' ];
	$base64 = str_replace( 'data:image/jpeg;base64,', '', $_POST[ 'base64' ] ); // strip header
	$tmpfile = '/srv/http/tmp/thumbnail.jpg';
	$newfile = str_replace( 'svg', 'jpg', $thumbfile ); // if current is svg
	file_put_contents( $tmpfile, base64_decode( $base64 ) );
	exec( '/usr/bin/sudo /usr/bin/rm "'.$thumbfile.'"; /usr/bin/sudo /usr/bin/cp '.$tmpfile.' "'.$newfile.'"' );
} else if ( isset( $_POST[ 'power' ] ) ) {
	$mode = $_POST[ 'power' ];
	if ( $mode === 'screenoff' ) {
		exec( 'export DISPLAY=:0; xset dpms force off' );
		exit();
	}
	
	$sudo = '/usr/bin/sudo /usr/bin/';
	$sudosrv = '/usr/bin/sudo /srv/http/';
	// dual boot
	exec( $sudo.'mount | /usr/bin/grep -q mmcblk0p8 && /usr/bin/echo 8 > /sys/module/bcm2709/parameters/reboot_part' );
	
	if ( file_exists( '/srv/http/gpio/gpiooff.py' ) ) $cmd.= $sudosrv.'gpio/gpiooff.py;';
	if ( $redis->get( local_browser ) === '1' ) $cmd .= $sudo.'killall Xorg; /usr/local/bin/ply-image /srv/http/assets/img/bootsplash.png;';
	$cmd.= $sudo.'umount -f -a -t cifs nfs -l;';
	$cmd.= $sudo.'shutdown '.( $mode === 'reboot' ? '-r' : '-h' ).' now';
	exec( $cmd );
} else if ( isset( $_POST[ 'dirble' ] ) ) {
	$querytype = $_POST[ 'dirble' ];
	$args = isset( $_POST[ 'args' ] ) ? $_POST[ 'args' ] : '';
	if ( $querytype === 'categories' ) {
		$query = '/categories/primary';
	} else if ( $querytype === 'childs' ) {
		$query = '/category/'.$args.'/childs';
	} else if ( $querytype === 'stations' ) {
		$query = '/category/'.$args.'/stations';
	}
	$data = curlGet( 'http://api.dirble.com/v2'.$query.'?all=1&token='.$redis->hGet('dirble', 'apikey') );
//	echo $data;
	$array = json_decode( $data, true );
	$aL = count( $array );
	for( $i = 0; $i < $aL; $i++ ) {
		$name = $array[ $i ][ 'title' ] ?: $array[ $i ][ 'name' ];
		$sort = stripLeading( $name );
		$index[] = $sort[ 1 ];
		$array[ $i ][ 'sort' ] = $sort[ 0 ];
		$array[ $i ][ 'lisort' ] = $sort[ 1 ];
	}
	$data = sortData( $array, $index );
	echo json_encode( $data );
} else if ( isset( $_POST[ 'jamendo' ] ) ) {
	$apikey = $redis->hGet( 'jamendo', 'clientid' );
	$args = $_POST[ 'jamendo' ];
	if ( $args ) {
		echo curlGet( 'http://api.jamendo.com/v3.0/radios/stream?client_id='.$apikey.'&format=json&name='.$args );
		exit();
	}
	
	$jam_channels = json_decode( curlGet('http://api.jamendo.com/v3.0/radios/?client_id='.$apikey.'&format=json&limit=200' ) );
	foreach ( $jam_channels->results as $station ) {
		$channel = json_decode( curlGet('http://api.jamendo.com/v3.0/radios/stream?client_id='.$apikey.'&format=json&name='.$station->name ) );
		$station->stream = $channel->results[ 0 ]->stream;
	}
	echo json_encode( $jam_channels );
}
function stripLeading( $string ) {
	// strip articles | non utf-8 normal alphanumerics , fix: php strnatcmp ignores spaces + tilde for sort last
	$names = strtoupper( strVal( $string ) );
	$stripped = preg_replace(
		  array( '/^A\s+|^AN\s+|^THE\s+|[^\w\p{L}\p{N}\p{Pd} ~]/u', '/\s+/' )
		, array( '', '-' )
		, $names
	);
	$init = mb_substr( $stripped, 0, 1, 'UTF-8' );
	return array( $stripped, $init );
}
function sortData( $data, $index = null ) {
	usort( $data, function( $a, $b ) {
		return strnatcmp( $a[ 'sort' ], $b[ 'sort' ] );
	} );
	unset( $data[ 'sort' ] );
	if ( $index ) $data[][ 'index' ] = array_keys( array_flip( $index ) ); // faster than array_unique
	return $data;
}
function search2array( $result, $playlist = '' ) { // directories or files
	$lists = explode( "\n", rtrim( $result ) );
	$genre = $composer = $albumartist = '';
	foreach( $lists as $list ) {
		$root = in_array( explode( '/', $list )[ 0 ], [ 'USB', 'NAS', 'LocalStorage' ] );
		if ( $root ) {
			$ext = pathinfo( $list, PATHINFO_EXTENSION );
			if ( in_array( $ext, [ 'cue', 'm3u', 'm3u8', 'pls' ] ) ) {
				$data[] = array(
					  'playlist' => basename( $list )
					, 'filepl'   => $list
				);
			} else {
				$sort = stripLeading( basename( $list ) );
				$index[] = $sort[ 1 ];
				$data[] = array(
					  'directory' => $list
					, 'sort'      => $sort[ 0 ]
					, 'lisort'    => $sort[ 1 ]
				);
			}
		} else {
			$list = explode( '^^', rtrim( $list ) );
			$file = $list[ 4 ];
			$data[] = array(
				  'Title'  => $list[ 0 ] ?: '<gr>*</gr>'.pathinfo( $file, PATHINFO_FILENAME )
				, 'Time'   => $list[ 1 ]
				, 'Artist' => $list[ 2 ]
				, 'Album'  => $list[ 3 ]
				, 'file'   => $file
			);
			$index = [];
			if ( !$genre ) {
				if ( $list[ 5 ] !== '' ) $genre = $list[ 5 ];
			} else {
				if ( $list[ 5 ] !== $genre ) $genre = -1;
			}
			if ( !$composer && $list[ 6 ] !== '' ) $composer = $list[ 6 ];
			if ( !$albumartist && $list[ 7 ] !== '' ) $albumartist = $list[ 7 ];
		}
	}
	if ( $root ) $data = sortData( $data, $index );
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
		$cuem3u = isset( $list[ 8 ] ) ? $list[ 8 ] : '';
		if ( $cuem3u !== $prevcue ) {
			$prevcue = $cuem3u;
			$i = 1;
		}
		$file = $list[ 3 ];
		$track = $list[ 2 ] ?: dirname( $file );
		if ( substr( $track, 0, 4 ) === 'http' ) {
			$title = $track ? $webradioname[ $list[ 3 ] ] : basename( $file );
		} else if ( $list[ 0 ] ) {
			$title = $list[ 0 ];
		} else {
			$title = basename( $file );
		}
		if ( !$artist && $list[ 4 ] !== '' ) $artist = $list[ 4 ];
		if ( !$album && $list[ 5 ] !== '' ) $album = $list[ 5 ];
		if ( !$genre ) {
			if ( $list[ 6 ] !== '' ) $genre = $list[ 6 ];
		} else {
			if ( $list[ 6 ] !== $genre ) $genre = -1;
		}
		if ( !$composer && $list[ 7 ] !== '' ) $composer = $list[ 7 ];
		$data[] = array(
			  'file'  => $file
			, 'track' => $track
			, 'Title' => $title
			, 'Time'  => $list[ 1 ]
			, 'index' => $i++
			, 'cuem3u'   => $cuem3u
		);
	}
	if ( !$webradioname ) {
		$data[][ 'artist' ] = $artist;
		$data[][ 'album' ] = $album;
		$data[][ 'albumartist' ] = $albumartist ?: $data[ 0 ][ 'Artist' ];
		if ( $genre ) $data[][ 'genre' ] = $genre;
		if ( $composer ) $data[][ 'composer' ] = $composer;
	}
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
function getCover( $file ) {
	require_once( '/srv/http/enhancegetcover.php' );
	return getCoverart( '/mnt/MPD/'.$file );
}
function pushstream( $channel, $data ) {
	$ch = curl_init( 'http://localhost/pub?id='.$channel );
	curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
	curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( $data, JSON_NUMERIC_CHECK ) );
	curl_exec( $ch );
	curl_close( $ch );
}
function curlGet( $url ) {
	$ch = curl_init( $url );
	curl_setopt( $ch, CURLOPT_CONNECTTIMEOUT_MS, 400 );
	curl_setopt( $ch, CURLOPT_TIMEOUT, 10 );
	curl_setopt( $ch, CURLOPT_HEADER, 0 );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
	$response = curl_exec( $ch );
	curl_close( $ch );
	return $response;
}
function getBookmark( $redis ) {
	$rbkmarks = $redis->hGetAll( 'bkmarks' );
	if ( $rbkmarks ) {
		foreach ( $rbkmarks as $name => $path ) {
			$thumbfile = '/mnt/MPD/'.$path.'/thumbnail.jpg';
			if ( file_exists( $thumbfile ) ) {
				$thumbnail = file_get_contents( $thumbfile );
				$coverart = 'data:image/jpg;base64,'.base64_encode( $thumbnail );
			} else {
				$coverart = '';
			}
			$sort = stripLeading( $name );
			$index[] = $sort[ 1 ];
			$data[] = array(
				  'name'     => $name
				, 'path'     => $path
				, 'coverart' => $coverart
				, 'sort'     => $sort[ 0 ]
				, 'lisort'   => $sort[ 1 ]
			);
		}
		$data = sortData( $data );
	} else {
		$data = 0;
	}
	return $data;
}
function getLibraryCount() {
	$redis = new Redis();
	$redis->pconnect( '127.0.0.1' );
	$count = exec( '/srv/http/enhancecount.sh' );
	$count = explode( ' ', $count );
	$status = array(
		  'artist'       => $count[ 0 ]
		, 'album'        => $count[ 1 ]
		, 'song'         => $count[ 2 ]
		, 'albumartist'  => $count[ 3 ]
		, 'composer'     => $count[ 4 ]
		, 'genre'        => $count[ 5 ]
		, 'nas'          => $count[ 6 ]
		, 'usb'          => $count[ 7 ]
		, 'webradio'     => $count[ 8 ]
	);
	return $status;
}
function lsPlaylists() {
	$lines = shell_exec( 'mpc lsplaylists' );
	if ( $lines ) {
		$lists = explode( "\n", rtrim( $lines ) );
		foreach( $lists as $list ) {
			$sort = stripLeading( $list );
			$index[] = $sort[ 1 ];
			$data[] = array(
				  'name'   => $list
				, 'sort'   => $sort[ 0 ]
				, 'lisort' => $sort[ 1 ]
			);
		}
		$data = sortData( $data, $index );
		return $data;
	} else {
		return 0;
	}
}
