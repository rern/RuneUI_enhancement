<?php
function headers( $contenttype ) {
	header( 'Cache-Control: no-cache, no-store, must-revalidate' ); // HTTP 1.1.
	header( 'Pragma: no-cache' ); // HTTP 1.0.
	header( 'Expires: 0' ); // Proxies.
	header( 'Content-Type: '.$contenttype );
}
ob_implicit_flush( 0 );
ob_clean();
flush();

$file = $_POST[ 'file' ];

if ( $file !== 'spotify' ) {
	$file = '/mnt/MPD/'.$_POST[ 'file' ];
// 1. local coverart
	$dir = dirname( $file );
	$coverfiles = array(
		  'cover.png', 'cover.jpg', 'folder.png', 'folder.jpg', 'front.png', 'front.jpg'
		, 'Cover.png', 'Coverjpg', 'Folder.png', 'Folder.jpg', 'Front.png', 'Front.jpg'
	);
	foreach( $coverfiles as $cover ) {
		$coverfile = $dir.'/'.$cover;
		if ( file_exists( $coverfile ) ) {
			headers( 'image/'.pathinfo( $cover, PATHINFO_EXTENSION ) );
			readfile( $coverfile );
			exit();
		}
	}
// 2. extract from file (using GetID3 library)
	set_include_path( '/srv/http/app/libs/vendor/' );
	require_once( 'getid3/audioinfo.class.php' );
	$audioinfo = new AudioInfo();
	$id3tag = $audioinfo->Info( $file );
	$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
	if ( !empty( $cover ) ) {
		headers( $id3cover[ 'image_mime' ] );
		echo $id3cover[ 'data' ];
		exit();
	}
// 3. find coverart on Last.FM
	// check internet connection
	if ( !@fsockopen( 'ws.audioscrobbler.com', 80 ) ) break;
	
	function curlGet( $url ) {
		$ch = curl_init($url);
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
		curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
		$data = curl_exec($ch);
		curl_close($ch);
		return $data;
	}
	function setCoverart( $cover_url, $dir ) {
		$cover = curlGet( $cover_url );
		if ( !$cover ) return NULL;
		
		// save to fetch faster next time
		$fopen = fopen( $dir.'/cover.'.$coverext, 'w' );
		fwrite( $fopen, $cover );
		fclose( $fopen );
		headers( 'image/'.pathinfo( $cover_url, PATHINFO_EXTENSION ));
		echo $cover;
	}
	$apikey = $redis->get( 'lastfm_apikey' );
	$artist = urlencode( $status[ 'Artist' ] );
	$album = urlencode( $status[ 'Album' ] );
	$url = 'http://ws.audioscrobbler.com/2.0/?api_key='.$apikey.'&autocorrect=1&format=json&method=album.getinfo&artist='.$artist.'&album='.$album;
	$data = json_decode( curlGet( $url ), true );
	$cover_url = $data[ 'album' ][ 'image' ][ 3 ][ '#text' ];
	
	if ( !empty( $cover_url ) ) {
		$status[ 'coverart' ] = setCoverart( $cover_url, $dir );
	} else {
		$url = 'http://ws.audioscrobbler.com/2.0/?api_key='.$apikey.'&autocorrect=1&format=json&method=artist.getinfo&artist='.$artist;
		$data = json_decode( curlGet( $url ), true );
		$cover_url = $data[ 'artist' ][ 'image' ][ 3 ][ '#text' ];
		if ( !empty( $cover_url ) ) $status[ 'coverart' ] = setCoverart( $cover_url, $dir );
	}
} else {
	$spop = openSpopSocket('localhost', 6602, 1);
	$count = 1;
	while ($count !== 10) {
		sendSpopCommand($spop, 'image');
		unset($spotify_cover);
		$spotify_cover = readSpopResponse($spop);
		$spotify_cover = json_decode($spotify_cover);
		usleep(500000);
		if ($spotify_cover->status === 'ok') {
			$spotify_cover = base64_decode($spotify_cover->data);
			break;
		}
		$count++;
	}
	if (!empty($spotify_cover)) {
		$bufferinfo = new finfo(FILEINFO_MIME);
		$spotify_cover_mime = $bufferinfo->buffer($spotify_cover);
		headers($spotify_cover_mime);
		echo $spotify_cover;
	}
}
// 4. default rune-cover image    
headers( 'image/png' );
readfile( '/srv/http/assets/img/cover-default-runeaudio.png' );
