<?php
if ( isset( $_POST[ 'bash' ] ) ) {
	echo shell_exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	exit();
}
// with redis
$redis = new Redis();
$redis->pconnect( '127.0.0.1' );

$sudo = '/usr/bin/sudo /usr/bin';

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
				$data[][ 'coverart' ] = getCover( $data[ 0 ][ 'file' ] );
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
} else if ( isset( $_POST[ 'plappend' ] ) ) {
	$plfile = '/srv/http/assets/img/playlists/'.$_POST[ 'plappend' ];
	$content = file_get_contents( $plfile );
	$content.= $_POST[ 'list' ]."\n";
	file_put_contents( $plfile, $content );
} else if ( isset( $_POST[ 'coverartalbum' ] ) ) {
	$album = str_replace( '"', '\"', $_POST[ 'coverartalbum' ] );
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
		$data[][ 'coverart' ] = getCover( $data[ 0 ][ 'file' ] );
	}
	echo json_encode( $data );
} else if ( isset( $_POST[ 'getcount' ] ) ) {
	$status = getLibraryCount();
	echo json_encode( $status, JSON_NUMERIC_CHECK );
} else if ( isset( $_POST[ 'setorder' ] ) ) {
	$order = $_POST[ 'setorder' ]; 
	$redis->hSet( 'display', 'order', $order );
	$order = explode( '^^', $order );
	pushstream( 'display', array( 'order' => $order ) );
} else if ( isset( $_POST[ 'bookmarks' ] ) ) {
	$name = $_POST[ 'bookmarks' ];
	$path = $_POST[ 'path' ];
	$pathname = str_replace( '/', '|', $path );
	$dir = '/srv/http/assets/img/bookmarks';
	$file = "$dir/$pathname";
	$order = $redis->hGet( 'display', 'order' );
	if ( $order ) {
		$order = explode( '^^', $order );
		if ( !$name ) {
			$index = array_search( $path, $order );
			if ( $index !== false ) unset( $order[ $index ] );
		} else if ( !$oldname ) {
			array_push( $order, $path ); // append
		}
		pushstream( 'display', array( 'order' => $order ) );
		$order = implode( '^^', $order );
		$redis->hSet( 'display', 'order', $order );
	}
	if ( isset( $_POST[ 'new' ] ) ) {
		if ( isset( $_POST[ 'base64' ] ) ) {
			file_put_contents( "$file", $_POST[ 'base64' ] );
		} else {
			file_put_contents( "$file", $name );
		}
	} else if ( isset( $_POST[ 'rename' ] ) ) {
		file_put_contents( "$file", $name );
	} else if ( isset( $_POST[ 'delete' ] ) ) {
		unlink( $file );
	}
	$data = getBookmark( $redis );
	pushstream( 'bookmark', $data );
} else if ( isset( $_POST[ 'webradios' ] ) ) {
	$name = $_POST[ 'webradios' ];
	$url = $_POST[ 'url' ];
	$urlname = str_replace( '/', '|', $url );
	$dir = '/srv/http/assets/img/webradios';
	$file = "/srv/http/assets/img/webradios/$urlname";
	if ( ( isset( $_POST[ 'new' ] ) || isset( $_POST[ 'save' ] ) ) 
		&& file_exists( $file )
	) {
		echo file_get_contents( $file );
		exit;
	}
	
	if ( isset( $_POST[ 'new' ] ) ) {
		file_put_contents( "$dir/$urlname", $name );
		$count = 1;
	} else if ( isset( $_POST[ 'rename' ] ) ) {
		$content = file( $file, FILE_IGNORE_NEW_LINES );
		if ( count( $content ) > 1 ) $name.= "\n".$content[ 1 ]."\n".$content[ 2 ];
		file_put_contents( "$dir/$urlname", $name ); // name, thumbnail, coverart
		$count = 0;
	} else if ( isset( $_POST[ 'delete' ] ) ) {
		unlink( $file );
		$count = -1;
	} else if ( isset( $_POST[ 'save' ] ) ) {
		file_put_contents( $file, $name );
		unlink( "/srv/http/assets/img/webradiopl/$urlname" );
		$count = 1;
	}
	pushstream( 'webradio', $count );
} else if ( isset( $_POST[ 'imagefile' ] ) ) {
	$imagefile = $_POST[ 'imagefile' ];
	if ( isset( $_POST[ 'base64bookmark' ] ) ) {
		$file = '/srv/http/assets/img/bookmarks/'.$imagefile;
		file_put_contents( $file, $_POST[ 'base64bookmark' ] );
		exit;
	} else if ( isset( $_POST[ 'base64webradio' ] ) ) {
		$file = '/srv/http/assets/img/webradios/'.$imagefile;
		file_put_contents( $file, $_POST[ 'base64webradio' ] ) || exit( -1 );
		exit;
	}
	
	// coverart or thumbnail
	$coverfile = isset( $_POST[ 'coverfile' ] );
	if ( $coverfile ) exec( "$sudo/mv -f \"$imagefile\"{,.backup}", $output, $std );
	if ( !isset( $_POST[ 'base64' ] ) ) { // delete
		unlink( $imagefile );
		exit;
	}
	
	$base64 = explode( ',', $_POST[ 'base64' ] )[ 1 ];
	if ( $coverfile ) {
		$tmpfile = '/srv/http/assets/img/tmp/tmp.jpg';
		file_put_contents( $tmpfile, base64_decode( $base64 ) ) || exit( '-1' );
		exec( "$sudo/mv -f $tmpfile \"$imagefile\"", $output, $std );
	} else {
		$newfile = substr( $imagefile, 0, -3 ).'jpg'; // if existing is 'cover.svg'
		file_put_contents( $imagefile, base64_decode( $base64 ) ) || exit( '-1' );
		$std = 0;
	}
	echo $std;
} else if ( isset( $_POST[ 'getbookmarks' ] ) ) {
	$data = getBookmark( $redis );
	echo json_encode( $data );
} else if ( isset( $_POST[ 'getwebradios' ] ) ) {
	$dir = '/srv/http/assets/img/webradios';
	$files = array_slice( scandir( $dir ), 2 );
	if ( !count( $files ) ) {
		echo 0;
		exit;
	}
	
	foreach( $files as $file ) {
		$nameimg = file( "$dir/$file", FILE_IGNORE_NEW_LINES ); // name, base64thumbnail, base64image
		$name = $nameimg[ 0 ];
		$thumb = $nameimg[ 1 ] ? $nameimg[ 1 ] : '';
		$sort = stripLeading( $name );
		$index[] = $name[ 0 ];
		$data[] = array(
			  'webradio' => $name
			, 'url'      => str_replace( '|', '/', $file )
			, 'thumb'    => $thumb
			, 'sort'     => $sort[ 0 ]
			, 'lisort'   => $sort[ 1 ]
		);
	}
	$data = sortData( $data, $index );
	echo json_encode( $data );
} else if ( isset( $_POST[ 'getdisplay' ] ) ) {
	usleep( 100000 ); // !important - get data must wait connection start at least (0.05s)
	$data = $redis->hGetAll( 'display' );
	$data[ 'volumempd' ] = $redis->get( 'volume' );
	$data[ 'spotify' ] = $redis->hGet( 'spotify', 'enable' ) == 1 ? 'checked' : '';
	$data[ 'order' ] = explode( '^^', $data[ 'order' ] );
	if ( isset( $_POST[ 'data' ] ) ) {
		echo json_encode( $data, JSON_NUMERIC_CHECK );
	} else {
		pushstream( 'display', $data );
	}
} else if ( isset( $_POST[ 'setdisplay' ] ) ) {
	$data = $_POST[ 'setdisplay' ];
	foreach( $data as $key => $value ) {
		$redis->hSet( 'display', $key, $value );
	}
	pushstream( 'display', $data );
} else if ( isset( $_POST[ 'getplaylist' ] ) ) { // Playlist page
	if ( isset( $_POST[ 'lsplaylists' ] ) ) {
		$data = lsPlaylists();
		echo json_encode( $data );
		exit();
	}
	
	$name = isset( $_POST[ 'name' ] ) ? $_POST[ 'name' ] : '';
	if ( !$name ) {
		$data[ 'lsplaylists' ] = lsPlaylists();
		$lines = playlistInfo();
	} else {
		$file = "/srv/http/assets/img/playlists/$name";
		$lines = file_get_contents( $file );
	}
	$data[ 'playlist' ] = $lines ? list2array( $lines, 'playlist' ) : '';
	echo json_encode( $data );
} else if ( isset( $_POST[ 'saveplaylist' ] ) ) {
	savePlaylist( $_POST[ 'saveplaylist' ] );
} else if ( isset( $_POST[ 'loadplaylist' ] ) ) {
	if ( $_POST[ 'replace' ] ) exec( 'mpc clear' );
	loadPlaylist( $_POST[ 'loadplaylist' ] );
	if ( $_POST[ 'play' ] ) exec( 'sleep 1; mpc play' );
} else if ( isset( $_POST[ 'playlist' ] ) ) { //cue, m3u, pls
	$plfiles = $_POST[ 'playlist' ];
	foreach( $plfiles as $file ) {
		$ext = pathinfo( $file, PATHINFO_EXTENSION ) === 'cue' ? ' + cue' : '';
		$plfile = preg_replace( '/([&\[\]])/', '#$1', $file ); // escape literal &, [, ] in %file% (operation characters)
		$lines.= shell_exec( 'mpc -f "%file%'.$ext.'^^%title%^^%time%^^[##%track% • ][%artist%][ • %album%]^^[%albumartist%|%artist%]^^%album%^^%genre%^^%composer%^^'.$plfile.'" playlist "'.$file.'"' );
	}
	$data = list2array( $lines );
	$data[][ 'path' ] = dirname( $plfiles[ 0 ] );
	if ( $redis->hGet( 'display', 'coverfile' ) ) {
		$data[][ 'coverart' ] = getCover( $data[ 0 ][ 'file' ] );
	}
	echo json_encode( $data );
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
			$data[][ 'coverart' ] = getCover( $data[ 0 ][ 'file' ] );
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
} else if ( isset( $_POST[ 'power' ] ) ) {
	$mode = $_POST[ 'power' ];
	if ( $mode === 'screenoff' ) {
		exec( 'export DISPLAY=:0; xset dpms force off' );
		exit();
	}
	
	// dual boot
	exec( "$sudo/mount | /usr/bin/grep -q mmcblk0p8 && /usr/bin/echo 8 > /sys/module/bcm2709/parameters/reboot_part" );
	
	if ( file_exists( '/root/gpiooff.py' ) ) $cmd.= '/usr/bin/sudo /root/gpiooff.py;';
	if ( $redis->get( local_browser ) === '1' ) $cmd .= "$sudo/killall Xorg; /usr/local/bin/ply-image /srv/http/assets/img/bootsplash.png;";
	$cmd.= "$sudo/redis-cli save;";
	$cmd.= "$sudo/umount -f -a -t cifs nfs -l;";
	$cmd.= "$sudo/shutdown ".( $mode === 'reboot' ? '-r' : '-h' ).' now';
	exec( $cmd );
} else if ( isset( $_POST[ 'dirble' ] ) ) {
	$querytype = $_POST[ 'dirble' ];
	$args = isset( $_POST[ 'args' ] ) ? $_POST[ 'args' ] : '';
	if ( $querytype === 'categories' ) {
		$query = 'categories/primary';
	} else if ( $querytype === 'childs' ) {
		$query = 'category/'.$args.'/childs';
	} else if ( $querytype === 'stations' ) {
		$query = 'category/'.$args.'/stations';
	}
	$data = curlGet( 'http://api.dirble.com/v2/'.$query.'?all=1&token='.$redis->hGet('dirble', 'apikey') );
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
	
	$array = json_decode( curlGet('http://api.jamendo.com/v3.0/radios/?client_id='.$apikey.'&format=json&limit=200' ) );
	foreach ( $array->results as $station ) {
		$channel = json_decode( curlGet('http://api.jamendo.com/v3.0/radios/stream?client_id='.$apikey.'&format=json&name='.$station->name ) );
		$station->stream = $channel->results[ 0 ]->stream;
		$sort = stripLeading( $station->dispname );
		$index[] = $sort[ 1 ];
		$station->sort = $sort[ 0 ];;
		$station->lisort = $sort[ 1 ];;
	}
	usort( $array->results, function( $a, $b ) {
		return strnatcmp( $a->sort, $b->sort );
	} );
	$result = $array->results;
	$result[] = array( 'index' => $index );
	echo json_encode( $result );
}
function stripLeading( $string ) {
	$names = strtoupper( strVal( $string ) );
	$stripped = preg_replace(
		  array(
			'/^A\s+|^AN\s+|^THE\s+|[^\w\p{L}\p{N}\p{Pd} ~]/u',
			'/\s+|^_/'
		)
		, array(
			'',  // strip articles | non utf-8 normal alphanumerics | tilde(blank data)
			'-'  // fix: php strnatcmp ignores spaces | sort underscore to before 0
		)
		, $names
	);
	$init = mb_substr( $stripped, 0, 1, 'UTF-8' );
	return array( $stripped, $init );
}
function sortData( $data, $index = null ) {
	usort( $data, function( $a, $b ) {
		return strnatcmp( $a[ 'sort' ], $b[ 'sort' ] );
	} );
	$dataL = count( $data );
	for( $i = 0; $i < $dataL; $i++ ) unset( $data[ $i ][ 'sort' ] );
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
function list2array( $result, $playlist = '' ) {
// 0-file, 1-title, 2-time, 3-track, 4-artist, 5-album, 6-genre, 7-composer, 8-cuem3u, 9-cuetrack
	$artist = $album = $genre = $composer = '';
	$lists = explode( "\n", rtrim( $result ) );
	foreach( $lists as $list ) {
		$list = explode( '^^', rtrim( $list ) );
		$cuem3u = isset( $list[ 8 ] ) ? $list[ 8 ] : '';
		if ( $cuem3u !== $prevcue ) {
			$prevcue = $cuem3u;
			$i = 1;
		}
		if ( !$artist && $list[ 4 ] !== '' ) $artist = $list[ 4 ];
		if ( !$album && $list[ 5 ] !== '' ) $album = $list[ 5 ];
		if ( !$genre ) {
			if ( $list[ 6 ] !== '' ) $genre = $list[ 6 ];
		} else {
			if ( $list[ 6 ] !== $genre ) $genre = -1;
		}
		if ( !$composer && $list[ 7 ] !== '' ) $composer = $list[ 7 ];
		$li = array(
			  'file'   => $list[ 0 ]
			, 'Title'  => $list[ 1 ]
			, 'Time'   => $list[ 2 ]
			, 'track'  => $list[ 3 ]
			, 'index'  => $i++
		);
		if ( $list[ 8 ] ) $li[ 'cuem3u' ] = $list[ 8 ];
		if ( $list[ 9 ] ) $li[ 'cuetrack' ] = $list[ 9 ];
		if ( $list[ 10 ] ) $li[ 'thumb' ] = $list[ 10 ];
		if ( $list[ 11 ] ) $li[ 'img' ] = $list[ 11 ];
		$data[] = $li;
	}
	if ( !$webradio && !$playlist ) {
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
function getBookmark() {
	$dir = '/srv/http/assets/img/bookmarks';
	$files = array_slice( scandir( $dir ), 2 );
	if ( !count( $files ) ) return 0;
	
	foreach( $files as $file ) {
		$content = file_get_contents( "$dir/$file" );
		$isimage = substr( $content, 0, 10 ) === 'data:image';
		if ( $isimage ) {
			$name = '';
			$coverart = $content;
		} else {
			$name = $content;
			$coverart = '';
		}
		$data[] = array(
			  'name'     => $name
			, 'path'     => str_replace( '|', '/', $file )
			, 'coverart' => $coverart
		);
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
		, 'sd'           => $count[ 9 ]
	);
	return $status;
}
function lsPlaylists() {
	$lines = array_slice( scandir( '/srv/http/assets/img/playlists' ), 2 );
	if ( count( $lines ) ) {
		foreach( $lines as $line ) {
			$sort = stripLeading( $line );
			$index[] = $sort[ 1 ];
			$data[] = array(
				  'name'   => $line
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
function second2HMS( $second ) {
	if ( $second <= 0 ) return 0;
	
	$second = round( $second );
	$hh = floor( $second / 3600 );
	$mm = floor( ( $second % 3600 ) / 60 );
	$ss = $second % 60;
	
	$hh = $hh ? $hh.':' : '';
	$mm = $hh ? ( $mm > 9 ? $mm.':' : '0'.$mm.':' ) : ( $mm ? $mm.':' : '' );
	$ss = $mm ? ( $ss > 9 ? $ss : '0'.$ss ) : $ss;
	return $hh.$mm.$ss;
}
function playlistInfo( $save = '' ) { // fix -  mpd unable to save cue/m3u properly
	$playlistinfo = shell_exec( '{ sleep 0.05; echo playlistinfo; sleep 0.05; } | telnet localhost 6600 | grep "^file\|^Range\|^AlbumArtist:\|^Title\|^Album\|^Artist\|^Track\|^Time"' );
	if ( !$playlistinfo ) return '';
	
	$content = preg_replace( '/\nfile:/', "\n^^file:", $playlistinfo );
	$lines = explode( '^^', $content );
	$list = '';
	foreach( $lines as $line ) {
		$file = $Range = $AlbumArtist = $Title = $Album = $Artist = $Track = $Time = $webradio = $thumb = $img = '';
		$data = strtok( $line, "\n" );
		while ( $data !== false ) {
			$pair = explode( ': ', $data );
			switch( $pair[ 0 ] ) {
				case 'file': $file = $pair[ 1 ]; break;
				case 'Range': $Range = $pair[ 1 ]; break;
				case 'AlbumArtist': $AlbumArtist = $pair[ 1 ]; break;
				case 'Title': $Title = $pair[ 1 ]; break;
				case 'Album': $Album = $pair[ 1 ]; break;
				case 'Artist': $Artist = $pair[ 1 ]; break;
				case 'Track': $Track = intval( $pair[ 1 ] ); break;
				case 'Time': $Time = second2HMS( $pair[ 1 ] ); break;
			}
			$data = strtok( "\n" );
		}
		$webradio = substr( $file, 0, 4 ) === 'http';
		if ( $webradio ) {
			$filename = str_replace( '/', '|', $file );
			$webradiofile = "/srv/http/assets/img/webradios/$filename";
			if ( !file_exists( $webradiofile ) ) $webradiofile = "/srv/http/assets/img/webradiopl/$filename";
			if ( file_exists( $webradiofile ) ) {
				$nameimg = file( $webradiofile, FILE_IGNORE_NEW_LINES );
				$Title = $nameimg[ 0 ];
				$thumb = $nameimg[ 1 ];
				$img = $nameimg[ 2 ];
			}
		}
		if ( $save && $webradio ) {
			$list.= "$file^^$Title";
		} else {
			$list.= $Range ? '' : $file;
			$list.= '^^'.( $Title ?: $file )."^^$Time^^";
			if ( $webradio ) {
				$list.= $file;
			} else {
				$list.= $Track ? "#$Track • " : '';
				$list.= $AlbumArtist ?: ( $Artist ?: '' );
				$list.= $Album ? " • $Album" : '';
			}
			if ( $Range ) $list.= '^^^^^^^^^^'.preg_replace( '/(.*)\..*/', '$1', $file ).".cue^^$Track";
			if ( $thumb ) $list.= "^^$thumb^^$img";
		}
		$list.= "\n";
	}
	return $list;
}
function savePlaylist( $name ) {
	$list = playlistInfo( 'save' );
	file_put_contents( "/srv/http/assets/img/playlists/$name", $list );
}
function loadPlaylist( $name ) { // fix -  mpd unable to save cue properly
	$playlistinfo = file_get_contents( "/srv/http/assets/img/playlists/$name" );
	$lines = explode( "\n", rtrim( $playlistinfo ) );
	foreach( $lines as $line ) {
		$list = explode( '^^', $line );
		$file = $list[ 0 ];
		$cuetrack = $list[ 9 ];
		if ( $cuetrack ) {
			$cuefile = preg_replace( '/.[^.]*$/', '', $file ).'.cue';
			exec( '/srv/http/enhance1cuem3u.sh "'.$cuefile.'" '.$cuetrack );
		} else {
			exec( 'mpc add "'.$file.'"' );
		}
	}
}
