<?php
/*
 * Copyright (C) 2013-2014 RuneAudio Team
 * http://www.runeaudio.com
 *
 * RuneUI
 * copyright (C) 2013-2014 - Andrea Coiutti (aka ACX) & Simone De Gregori (aka Orion)
 *
 * RuneOS
 * copyright (C) 2013-2014 - Simone De Gregori (aka Orion) & Carmelo San Giovanni (aka Um3ggh1U)
 *
 * RuneAudio website and logo
 * copyright (C) 2013-2014 - ACX webdesign (Andrea Coiutti)
 *
 * This Program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3, or (at your option)
 * any later version.
 *
 * This Program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with RuneAudio; see the file COPYING.  If not, see
 * <http://www.gnu.org/licenses/gpl-3.0.txt>.
 *
 *  file: file: app/coverart_ctl.php
 *  version: 1.3
 *  coder: Simone De Gregori
 *
 */
// direct output bypass template system
$tplfile = 0;
runelog("\n--------------------- coverart (start) ---------------------");
// turn off output buffering
ob_implicit_flush(0);

ob_clean();
flush();
			
// --------------------- MPD ---------------------
if ($activePlayer === 'MPD') {
    // connect to MPD daemon
    $mpd2 = openMpdSocket('/run/mpd.sock', 0);
    // fetch MPD status
    $status = _parseStatusResponse(MpdStatus($mpd2));
    $curTrack = getTrackInfo($mpd2, $status['song']);
    $mpdRoot = "/mnt/MPD/";
    $trackMpdPath = findPLposPath($status['song'], $mpd2);
    $currentpath = $mpdRoot.$trackMpdPath;
    closeMpdSocket($mpd2);
    // 1. local coverart
    $local_cover_root = dirname( $currentpath );
    $files = array( 'cover.jpg', 'cover.png', 'folder.jpg', 'folder.png' );
    foreach( $files as $file ) {
    	$local_cover_path = $local_cover_root.'/'.$file;
    	if ( file_exists( $local_cover_path ) ) {
            header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
            header('Pragma: no-cache'); // HTTP 1.0.
            header('Expires: 0'); // Proxies.
            header('Content-Type: ' .mime_content_type($local_cover_path));

            readfile($local_cover_path);
	        // debug
	        runelog("coverart: local (path): ", $local_cover_path);
	        runelog("coverart match: cover-local");
        	die();
    	}
    }

    // output switch
    $output = 0;
    include('getid3/audioinfo.class.php');
    // get Last.FM api-key
    $lastfm_apikey = $redis->get('lastfm_apikey');
    // get HTTP proxy settings
    $proxy = $redis->hGetall('proxy');
    // debug
    runelog("MPD current path", $currentpath);
    $request_uri = urldecode($_SERVER['REQUEST_URI']);
    runelog("HTTP GET request_uri (urldecoded)", $request_uri);
    $request_folder = substr(substr($request_uri, 0, strrpos($request_uri, "/")), 10);
    runelog("HTTP GET (request_folder)", $request_folder);
    $request_coverfile = substr($request_uri, strrpos($request_uri, "/") + 1);
    runelog("HTTP GET (request_coverfile)", $request_coverfile);
    $current_mpd_folder = substr(substr($currentpath, 0, strrpos($currentpath, "/")), 9);
    runelog("MPD (current_mpd_folder)", $current_mpd_folder);
// --------------------- Spotify ---------------------
} elseif ($redis->get('activePlayer') === 'Spotify') {
    runelog('rune_PL_wrk: open SPOP socket');
    $spop = openSpopSocket('localhost', 6602, 1);
}
if ((substr($request_coverfile, 0, 2) === '?v' OR $current_mpd_folder ===  $request_folder) && $activePlayer === 'MPD') {
    // extract song details
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
        // debug
        runelog("coverart match: embedded (GetID3 lib)");
        header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
        header('Pragma: no-cache'); // HTTP 1.0.
        header('Expires: 0'); // Proxies.
        header('Content-Type: ' .$auinfo['comments']['picture'][0]['image_mime']);
        echo $auinfo['comments']['picture'][0]['data'];
        die();
    } 
    // 3. find coverart on Last.FM (Album)
    $cover_url = ui_lastFM_coverart($status['currentartist'], $status['currentalbum'], $lastfm_apikey, $proxy);
    $bufferinfo = new finfo(FILEINFO_MIME);
    if (!empty($cover_url)) {
        // debug
        runelog("coverart match: lastfm (query 1) coverURL=", $cover_url);
        $lastfm_img = curlGet($cover_url, $proxy);
        $lastfm_img_mime = $bufferinfo->buffer($lastfm_img);
    } else {
        // find coverart on Last.FM (Artist)
        $cover_url = ui_lastFM_coverart($status['currentartist'], '', $lastfm_apikey, $proxy);
        if (!empty($cover_url)) {
            // debug
            runelog("coverart match: lastfm (query 2) coverURL=", $cover_url);
            if (!empty($cover_url)) {
                $lastfm_img = curlGet($cover_url, $proxy);
                $lastfm_img_mime = $bufferinfo->buffer($lastfm_img);
            }
        }
    }
    if (!empty($lastfm_img)) {
        header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
        header('Pragma: no-cache'); // HTTP 1.0.
        header('Expires: 0'); // Proxies.
        header('Content-Type: '.$lastfm_img_mime);
        echo $lastfm_img;
        // save to directory
        $filecoverext = $lastfm_img_mime == 'image/png; charset=binary' ? 'png' : 'jpg';
        $filecover = fopen( $local_cover_root.'/cover.'.$filecoverext, 'w' );
        fwrite( $filecover, $lastfm_img );
        fclose( $filecover );
        
        die();
    }
    // 4. default rune-cover image    
    // debug
    runelog("coverart match: cover-default");
    header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
    header('Pragma: no-cache'); // HTTP 1.0.
    header('Expires: 0'); // Proxies.
    header('Content-Type: ' .mime_content_type($_SERVER['HOME'].'/assets/img/cover-default.png'));
    readfile($_SERVER['HOME'].'/assets/img/cover-default.png');
} else {
    if ($activePlayer === 'Spotify') {
        $count = 1;
        do {
            sendSpopCommand($spop, 'image');
            unset($spotify_cover);
            $spotify_cover = readSpopResponse($spop);
            $spotify_cover = json_decode($spotify_cover);
            usleep(500000);
            runelog('coverart (spotify): retry n: '.$count, $spotify_cover->status);
            if ($spotify_cover->status === 'ok') {
                $spotify_cover = base64_decode($spotify_cover->data);
                break;
            }
            $count++;
        } while ($count !== 10);
        $bufferinfo = new finfo(FILEINFO_MIME);
        $spotify_cover_mime = $bufferinfo->buffer($spotify_cover);
        header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
        header('Pragma: no-cache'); // HTTP 1.0.
        header('Expires: 0'); // Proxies.
        header('Content-Type: '.$spotify_cover_mime);
        echo $spotify_cover;
    } else {
        if ($activePlayer === 'Airplay') {
            // debug
            runelog("coverart match: shairport coverURL=/var/run/shairport/cover.jpg");
            header('Cache-Control: no-cache, no-store, must-revalidate'); // HTTP 1.1.
            header('Pragma: no-cache'); // HTTP 1.0.
            header('Expires: 0'); // Proxies.
            if (is_file($_SERVER['HOME'].'/assets/img/airplay-cover.jpg')) {
                header('Content-Type: ' .mime_content_type($_SERVER['HOME'].'/assets/img/airplay-cover.jpg'));
                readfile($_SERVER['HOME'].'/assets/img/airplay-cover.jpg');
            } else {
                header('Content-Type: ' .mime_content_type($_SERVER['HOME'].'/assets/img/cover-default.png'));
                readfile($_SERVER['HOME'].'/assets/img/cover-default.png');
            }
        } else {
            // redirect to /covers NGiNX location
            $local_cover_url =  'http://'.$_SERVER["SERVER_ADDR"].'/covers/'.$request_folder.'/'.$request_coverfile;
            runelog("coverart: redirect to local-coverart (url): ", $local_cover_url);
            header('Location: '.$local_cover_url, true, 301);
        }
    }
}
runelog("\n--------------------- coverart (end) ---------------------");
