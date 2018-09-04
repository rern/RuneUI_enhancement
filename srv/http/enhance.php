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
if ( isset( $_POST[ 'redis' ] ) ) { // only for get and set display
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$array = json_decode( $_POST[ 'redis' ], true );
	foreach ( $array as $field => $arg ) {
		$count = count( $arg );
		if ( $count === 2 ) {
			$result[ $field ] = $redis->$arg[ 0 ]( $arg[ 1 ] );
		} else if ( $count === 3 ) {
			$result[ $field ] = $redis->$arg[ 0 ]( $arg[ 1 ], $arg[ 2 ] );
		} else if ( $count === 4 ) {
			$result[ $field ] = $redis->$arg[ 0 ]( $arg[ 1 ], $arg[ 2 ], $arg[ 3 ] );
		}
	}
	usleep( 100000 ); // !important - < 50000 data broken
	// broadcast to all clients on hmSet display or set volume
	$result[ 'display' ] = $redis->hGetAll( 'display' );
	refreshUI( 'display', $result );
} else if ( isset( $_POST[ 'volume' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$volume = $_POST[ 'volume' ];
	$volumemute = $redis->hGet( 'display', 'volumemute' );
	if ( $volume == '-1' ) {
		if ( $volumemute == 0 ) {
			$currentvol = exec( "{ sleep 0.01; echo status; sleep 0.01; } | telnet localhost 6600 | grep volume | cut -d' ' -f2" );
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
	exec( '{ sleep 0.01; echo setvol '.$vol.'; sleep 0.01; } | telnet localhost 6600' );
	refreshUI( 'playback' );
} else if ( isset( $_POST[ 'mpd' ] ) ) {
	$mpd = $_POST[ 'mpd' ];
	if ( !is_array( $mpd ) ) {
		$command = 'echo '.$mpd.';';
	} else {
		$command = '';
		foreach( $mpd as $cmd ) {
			$command.= 'echo '.$cmd.';';
		}
	}
	$result = shell_exec( '{ sleep 0.01; '.$command.' sleep 0.01; } | telnet localhost 6600' );
	if ( isset( $_POST[ 'pushstream' ] ) ) refreshUI( $_POST[ 'pushstream' ], 1 );
	if ( isset( $_POST[ 'getresult' ] ) ) echo $result;
} else if ( isset( $_POST[ 'library' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$localStorages = exec( '{ sleep 0.01; echo list title base LocalStorage; sleep 0.1; } | telnet localhost 6600 | grep -c "^Title:"' );
	$networkmounts = exec( 'df | grep "/mnt/MPD/NAS" | wc -l' );
	$usbmounts = exec( 'df | grep "/mnt/MPD/USB" | wc -l' );
	$webradios = count( $redis->hKeys( 'webradios' ) );
	$activePlayer = $redis->get( 'activePlayer' );
	$redis_bookmarks = $redis->hGetAll( 'bookmarks' );
	foreach ( $redis_bookmarks as $key => $data ) {
		$bookmark = json_decode( $data );
		$path = $bookmark->path;
		$count = exec( '{ sleep 0.01; echo \'list title base "'.$path.'"\'; sleep 0.1; } | telnet localhost 6600 | grep -c "^Title:"' );
		$bk[] = array(
			  'id'   => $key
			, 'name' => $bookmark->name
			, 'path' => $path
			, 'count'=> $count
		);
	}
	function curlGet($url, $proxy = null) {
		$ch = curl_init($url);
		@curl_setopt($ch, CURLOPT_HTTPHEADER, array("Connection: close"));
		@curl_setopt($ch, CURLOPT_NOSIGNAL, 1);
		@curl_setopt($ch, CURLOPT_IPRESOLVE, CURL_IPRESOLVE_V4);
		if (isset($proxy)) {
			if ($proxy['enable'] === '1') {
				$proxy['user'] === '' || @curl_setopt($ch, CURLOPT_PROXYUSERPWD, $proxy['user'].':'.$proxy['pass']);
				@curl_setopt($ch, CURLOPT_PROXY, $proxy['host']);
			}
		}
		@curl_setopt($ch, CURLOPT_CONNECTTIMEOUT_MS, 400);
		@curl_setopt($ch, CURLOPT_TIMEOUT, 10);
		@curl_setopt($ch, CURLOPT_HEADER, 0);
		@curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		$response = curl_exec($ch);
		curl_close($ch);
		return $response;
	}
	$proxy = $redis->hGetall( 'proxy' );
	$dirblecfg = $redis->hGetAll( 'dirble' );
	$dirble = json_decode( curlGet( $dirblecfg[ 'baseurl' ].'amountStation/apikey/'.$dirblecfg[ 'apikey' ], $proxy ) );
	$spotify = $redis->hGet( 'spotify', 'enable' );
	
	$types = array( 'title', 'album', 'artist', 'composer', 'genre' );
	$counts = shell_exec( 'for type in '.implode( ' ', $types ).'; do mpc list $type | awk NF | wc -l; done' );
	$counts = explode( "\n", $counts );
	array_pop( $counts ); // remove last blank
	$counts = array_combine( $types, $counts );
	$status = array( 
		  'bookmarks'     => $bk
		, 'localStorages' => $localStorages
		, 'networkMounts' => $networkmounts
		, 'USBMounts'     => $usbmounts
		, 'webradio'      => $webradios
		, 'Spotify'       => $spotify
		, 'Dirble'        => $dirble->amount
		, 'ActivePlayer'  => $activePlayer
		, 'clientUUID'    => $clientUUID
		, 'counts'        => $counts
	);
	echo json_encode( $status, JSON_NUMERIC_CHECK );
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
