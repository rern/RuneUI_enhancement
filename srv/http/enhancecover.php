<?php
ob_implicit_flush( 0 );
ob_clean();
flush();
function curlGet( $url ) {
	$ch = curl_init($url);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
	$data = curl_exec($ch);
	curl_close($ch);
	return $data;
}
function headers( $contenttype ) {
	header( 'Cache-Control: no-cache, no-store, must-revalidate' ); // HTTP 1.1.
	header( 'Pragma: no-cache' ); // HTTP 1.0.
	header( 'Expires: 0' ); // Proxies.
	header( 'Content-Type: '.$contenttype );
}
$mpdtelnet = ' | telnet localhost 6600 | grep "^file:\|^Album:\|^Artist:"';
$lines = shell_exec( '{ sleep 0.01; echo clearerror; echo status; echo currentsong; sleep 0.05; }'.$mpdtelnet );
// fix: initially add song without play - currentsong = (blank)
if ( strpos( $lines, 'file:' ) === false ) $lines = shell_exec( '{ sleep 0.01; echo status; echo playlistinfo 0; sleep 0.05; }'.$mpdtelnet );
$line = strtok( $lines, "\n" );
while ( $line !== false ) {
	$pair = explode( ': ', $line, 2 );
	$key = $pair[ 0 ];
	$val = $pair[ 1 ];
	if ( $key === 'file' || $key === 'Album' || $key === 'Artist' ) $data[ $key ] = $val;
	$line = strtok( "\n" );
}
$file = '/mnt/MPD/'.$data[ 'file' ];
$pathinfo = pathinfo( $file );
$dir = $pathinfo[ 'dirname' ];
$ext = strtoupper( $pathinfo[ 'extension' ] );
// 1. local coverart file
$coverfiles = array(
	  'cover.png', 'cover.jpg', 'folder.png', 'folder.jpg', 'front.png', 'front.jpg'
	, 'Cover.png', 'Coverjpg', 'Folder.png', 'Folder.jpg', 'Front.png', 'Front.jpg'
);
foreach( $coverfiles as $cover ) {
	$coverfile = $dir.'/'.$cover;
	if ( file_exists( $coverfile ) ) {
		$coverext = pathinfo( $cover, PATHINFO_EXTENSION );
		headers( 'image/'.$coverext );
		readfile($coverfile);
		die();
	}
}
// 2. id3tag - for various albums in single directory
set_include_path( '/srv/http/app/libs/vendor/' );
require_once( 'getid3/audioinfo.class.php' );
$audioinfo = new AudioInfo();
$id3tag = $audioinfo->Info( $file );
$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
$cover = $id3cover[ 'data' ];
if ( !empty( $cover ) ) {
	headers( $id3cover[ 'image_mime' ] );
	echo $cover;
	die();
}
// 3. last.FM
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );
$apikey = $redis->get( 'lastfm_apikey' );
$artist = urlencode( $data[ 'Artist' ] );
$album = urlencode( $data[ 'Album' ] );
$url = 'http://ws.audioscrobbler.com/2.0/?api_key='.$apikey.'&autocorrect=1&format=json&method=album.getinfo&artist='.$artist.'&album='.$album;
$data = json_decode( curlGet( $url ), true );
$cover_url = $data[ 'album' ][ 'image' ][ 3 ][ '#text' ];
if ( empty( $cover_url ) ) {
	$url = 'http://ws.audioscrobbler.com/2.0/?api_key='.$apikey.'&autocorrect=1&format=json&method=artist.getinfo&artist='.$artist;
	$data = json_decode( curlGet( $url ), true );
	$cover_url = $data[ 'artist' ][ 'image' ][ 3 ][ '#text' ];
}
if ( !empty( $cover_url ) ) {
	$cover = curlGet( $cover_url );
	$coverext = pathinfo( $cover_url, PATHINFO_EXTENSION );
	headers( 'image/'.$coverext );
	echo $cover;
	// save to directory
	$filecover = fopen( $dir.'/cover.'.$coverext, 'w' );
	fwrite( $filecover, $cover);
	fclose( $filecover );
	die();
}
// 4. default
headers( 'image/png' );
readfile( '/srv/http/assets/img/cover-default-runeaudio.png');
