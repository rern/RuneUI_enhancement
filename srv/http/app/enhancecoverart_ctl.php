<?php
function headers($contenttype) {
	header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
	header('Pragma: no-cache'); // HTTP 1.0.
	header('Expires: 0'); // Proxies.
	header('Content-Type: '.$contenttype);
}
if ($activePlayer === 'MPD') {
	$mpd2 = openMpdSocket('/run/mpd.sock', 0);
	$status = _parseStatusResponse(MpdStatus($mpd2));
	$currentpath = '/mnt/MPD/'.findPLposPath($status['song'], $mpd2);
	closeMpdSocket($mpd2);
// 1. local coverart
	$local_cover_root = dirname( $currentpath );
	$files = array(
		  'cover.jpg', 'Cover.jpg', 'cover.png', 'Cover.png'
		, 'folder.jpg', 'Folder.jpg', 'folder.png', 'Folder.png'
		, 'front.jpg', 'Front.jpg', 'front.png', 'Front.png'
	);
	foreach( $files as $file ) {
		$local_cover_path = $local_cover_root.'/'.$file;
		if ( file_exists( $local_cover_path ) ) {
			headers(mime_content_type($local_cover_path));
			readfile($local_cover_path);
			die();
		}
	}
	include('getid3/audioinfo.class.php');
	$lastfm_apikey = $redis->get('lastfm_apikey');
	$proxy = $redis->hGetall('proxy');
} elseif ($redis->get('activePlayer') === 'Spotify') {
	$spop = openSpopSocket('localhost', 6602, 1);
}

$imgpath = $_SERVER['HOME'].'/assets/img';
if ((substr($request_coverfile, 0, 2) === '?v' OR $current_mpd_folder ===  $request_folder) && $activePlayer === 'MPD') {
	// extract song details
	$curTrack = getTrackInfo($mpd2, $status['song']);
	if (isset($curTrack[0]['Title'])) {
		$status['currentartist'] = $curTrack[0]['Artist'];
		$status['currentsong'] = $curTrack[0]['Title'];
		$status['currentalbum'] = $curTrack[0]['Album'];
		$status['fileext'] = parseFileStr($curTrack[0]['file'], '.');
	}
// 2. extract from file (using GetID3 library)
	$au = new AudioInfo();
	$auinfo =  $au->Info($currentpath);
	if (!empty($auinfo['comments']['picture'][0]['data'])) {
		headers($auinfo['comments']['picture'][0]['image_mime']);
		echo $auinfo['comments']['picture'][0]['data'];
		die();
	} 
// 3. find coverart on Last.FM (Album)
	$cover_url = ui_lastFM_coverart($status['currentartist'], $status['currentalbum'], $lastfm_apikey, $proxy);
	$bufferinfo = new finfo(FILEINFO_MIME);
	if (!empty($cover_url)) {
		$lastfm_img = curlGet($cover_url, $proxy);
		$lastfm_img_mime = $bufferinfo->buffer($lastfm_img);
	} else {
		$cover_url = ui_lastFM_coverart($status['currentartist'], '', $lastfm_apikey, $proxy);
		if (!empty($cover_url)) {
			$lastfm_img = curlGet($cover_url, $proxy);
			$lastfm_img_mime = $bufferinfo->buffer($lastfm_img);
		}
	}
	if (!empty($lastfm_img)) {
		headers($lastfm_img_mime);
		echo $lastfm_img;
		$filecoverext = $lastfm_img_mime == 'image/png; charset=binary' ? 'png' : 'jpg';
		$filecover = fopen( $local_cover_root.'/cover.'.$filecoverext, 'w' );
		fwrite( $filecover, $lastfm_img );
		fclose( $filecover );
		die();
	}
// 4. default rune-cover image    
	headers(mime_content_type($imgpath.'/cover-default-runeaudio.png'));
	readfile($imgpath.'/cover-default.png');
} else if ($activePlayer === 'Spotify') {
	for ($count = 0; $count < 10; $count++) {
		sendSpopCommand($spop, 'image');
		unset($spotify_cover);
		$spotify_cover = readSpopResponse($spop);
		$spotify_cover = json_decode($spotify_cover);
		usleep(500000);
		if ($spotify_cover->status === 'ok') {
			$spotify_cover = base64_decode($spotify_cover->data);
			break;
		}
	};
	$bufferinfo = new finfo(FILEINFO_MIME);
	$spotify_cover_mime = $bufferinfo->buffer($spotify_cover);
	headers($spotify_cover_mime);
	echo $spotify_cover;
} else if ($activePlayer === 'Airplay') {
	$coverart = file_exists($imgpath.'/airplay-cover.jpg') ? 'airplay-cover.jpg' : 'cover-default-runeaudio.png';
	headers(mime_content_type("$imgpath/$covrart"));
	readfile("$imgpath/$covrart");
}
