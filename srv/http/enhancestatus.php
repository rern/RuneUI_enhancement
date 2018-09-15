<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );
$activePlayer = $redis->get( 'activePlayer' );
$status[ 'activePlayer' ] = $activePlayer;

if ( $activePlayer === 'Airplay' ) {
	echo json_encode( $status );
	exit();
}

$lines = shell_exec( '{ sleep 0.01; echo clearerror; echo status; echo currentsong; sleep 0.05; } | telnet localhost 6600 | sed "/^Trying\|Connected\|Escape\|OK\|Connection/ d"' );
if ( !preg_match( '/\nfile:/', $lines ) ) {
	$lines = shell_exec( '{ sleep 0.01; echo status; echo playlistinfo 0; sleep 0.05; } | telnet localhost 6600 | sed "/^Trying\|Connected\|Escape\|OK\|Connection/ d"' );
}
$line = strtok( $lines, "\n" );
while ( $line !== false ) {
	$pair = explode( ': ', $line, 2 );
	$key = $pair[ 0 ];
	$val = $pair[ 1 ];
	if ( $key === 'elapsed' ) {
		$status[ $key ] = round( $val );
	} else if ( $key === 'bitrate' ) {
		$status[ $key ] = $val * 1000;
	} else if ( $key === 'audio' ) {
		$audio = explode( ':', $val );
		$status[ 'bitdepth' ] = $audio[ 1 ];
		$status[ 'samplerate' ] = $audio[ 0 ];
	} else {
		$status[ $key ] = $val;
	}
	$line = strtok( "\n" );
}
if ( array_key_exists( 'bitrate', $status ) ) {
	$sampling = substr( $status[ 'file' ], 0, 4 ) === 'http' ? '' : $status[ 'bitdepth' ].' bit ';
	$sampling.= round( $status[ 'samplerate' ] / 1000, 1 ).' kHz '.$status[ 'bitrate' ].' kbit/s';
	$status[ 'sampling' ] = $sampling;
} else {
	$status[ 'sampling' ] = '';
}
if ( !array_key_exists( 'song', $status ) ) $status[ 'song' ] = 0;

$file = '/mnt/MPD/'.$status[ 'file' ];
$pathinfo = pathinfo( $file );
$dir = $pathinfo[ 'dirname' ];

// coverart
if ( $activePlayer === 'MPD' ) {
	if ( !empty( $status[ 'Artist' ] ) ) {
// 1. fastest - local coverart
		$coverfiles = array(
			  'cover.jpg', 'Cover.jpg', 'cover.png', 'Cover.png'
			, 'folder.jpg', 'Folder.jpg', 'folder.png', 'Folder.png'
			, 'front.jpg', 'Front.jpg', 'front.png', 'Front.png'
		);
		foreach( $coverfiles as $cover ) {
			$coverfile = $dir.'/'.$cover;
			if ( file_exists( $coverfile ) ) {
				$coverext = pathinfo( $cover, PATHINFO_EXTENSION );
				$data = file_get_contents( $coverfile ) ;
				$status[ 'coverart' ] = 'data:image/'. $coverext.';base64,'.base64_encode( $data );
				break;
			}
		}
		if ( empty( $status[ 'coverart' ] ) ) {
// 2. last.FM
			function curlGet( $url ) {
				$ch = curl_init($url);
				curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
				curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 2);
				$data = curl_exec($ch);
				curl_close($ch);
				return $data;
			}
			$apikey = $redis->get( 'lastfm_apikey' );
			$artist = urlencode( $status[ 'Artist' ] );
			$album = urlencode( $status[ 'Album' ] );
			$url = 'http://ws.audioscrobbler.com/2.0/?api_key='.$apikey.'&autocorrect=1&format=json&method=album.getinfo&artist='.$artist.'&album='.$album;
			$data = json_decode( curlGet( $url ), true );
			$cover_url = $data[ 'album' ][ 'image' ][ 3 ][ '#text' ];
			
			if ( !empty( $cover_url ) ) {
				$cover = curlGet( $cover_url );
			} else {
				$url = 'http://ws.audioscrobbler.com/2.0/?api_key='.$apikey.'&autocorrect=1&format=json&method=artist.getinfo&artist='.$artist;
				$data = json_decode( curlGet( $url ), true );
				$cover_url = $data[ 'artist' ][ 'image' ][ 3 ][ '#text' ];
				if ( !empty( $cover_url ) ) $cover = curlGet( $cover_url );
			}
			if ( !empty( $cover ) ) {
				$coverext = pathinfo( $cover_url, PATHINFO_EXTENSION );
				$status[ 'coverart' ] = 'data:image/'. $coverext.';base64,'.base64_encode( $cover );
				// save locally - no need to get online next time
				$fopen = fopen( $dir.'/cover.'.$coverext, 'w' );
				fwrite( $fopen, $cover );
				fclose( $fopen );
			}
		}
	}
// 3. slowest - id3tag * Need new version of getID3()
	if ( empty( $status[ 'coverart' ] ) ) {
		require_once( '/srv/http/app/libs/vendor/getid3/getid3.php' );
		$getID3 = new getID3;
		$id3tag = $getID3->analyze( $file );
		$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
		$coverext = str_replace( 'image/', '', $id3cover[ 'image_mime' ] );
		$status[ 'coverart' ] = 'data:image/'. $coverext.';base64,'.base64_encode( $id3cover[ 'data' ] );
	}
} else if ( $activePlayer === 'Spotify' ) {
	include '/srv/http/app/libs/runeaudio.php';
	$spop = openSpopSocket( 'localhost', 6602, 1 );
	$count = 1;
	while ( $count < 10 ) {
		sendSpopCommand( $spop, 'image' );
		$cover = json_decode( readSpopResponse( $spop ) );
		usleep( 500000 );
		if ( $cover->status === 'ok' ) {
			$cover = $cover->data; // base64
			$bufferinfo = new finfo( FILEINFO_MIME );
			$coverext = $bufferinfo->buffer( $cover );
			$status[ 'coverart' ] = 'data:image/'. $coverext.';base64,'.$cover;
			break;
		}
		$count++;
	}
}
// no id3tag
if ( empty( $status[ 'Artist' ] ) ) $status[ 'Artist' ] = basename( $dir );
if ( empty( $status[ 'Title' ] ) ) $status[ 'Title' ] = $pathinfo[ 'filename' ];
if ( empty( $status[ 'Album' ] ) ) $status[ 'Album' ] = '';

$ext = strtoupper( $pathinfo[ 'extension' ] );
$status[ 'ext' ] = ( substr($file, 0, 4 ) !== 'http' ) ? $ext : 'radio';
if ( $status[ 'ext' ] === 'radio' ) {
	// before 1st play: no 'Name:' but 'Title:'= value of 'Name:' instead
	$status[ 'Artist' ] = isset( $status[ 'Name' ] ) ? $status[ 'Name' ] : $status[ 'Tile' ];
	$status[ 'Title' ] = ( $status[ 'state' ] === 'stop' ) ? '' : $status[ 'Title' ];
	$status[ 'Album' ] = $file;
	$status[ 'time' ] = '';
}

$webradios = $redis->hGetAll( 'webradios' );
$webradioname = array_flip( $webradios );
$name = $webradioname[ $file ];

// sampling >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
function samplingline( $bitdepth, $samplerate, $bitrate ) {
	if ( $bitdepth == 'N/A' ) {
		$bitdepth = ( $ext === 'WAV' || $ext === 'AIFF' ) ? ( $bitrate / $samplerate / 2 ).' bit ' : '';
	} else {
		$bitdepth = $bitdepth ? $bitdepth.' bit ' : '';
	}
	$samplerate = round( $samplerate / 1000, 1 ).' kHz ';
	if ( $bitrate < 1000000 ) {
		$bitrate = round( $bitrate / 1000 ).' kbit/s';
	} else {
		$bitrate = round( $bitrate / 1000000, 2 ).' Mbit/s';
	}
	return $bitdepth.$samplerate.$bitrate;
}
if ( $status[ 'state' ] === 'play' ) {
	// lossless - no bitdepth
	$bitdepth = ( $status[ 'ext' ] === 'radio' ) ? '' : $status[ 'bitdepth' ];
	$sampling = samplingline( $bitdepth, $status[ 'samplerate' ], $status[ 'bitrate' ] );
	$status[ 'sampling' ] = $sampling;
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	// save only webradio: update sampling database on each play
	$redis->hSet( 'sampling', $name, $sampling );
	exit();
}

// state: stop / pause >>>>>>>>>>
// webradio
if ( $status[ 'ext' ] === 'radio' ) {
	$webradios = $redis->hGetAll( 'webradios' );
	$webradioname = array_flip( $webradios );
	if ( $sampling = $redis->hGet( 'sampling', $name ) ) $status[ 'sampling' ] = $sampling;
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	exit();
}
// while stop no mpd info
if ( $ext === 'DSF' || $ext === 'DFF' ) {
	// DSF: byte# 56+4 ? DSF: byte# 60+4
	$byte = ( $ext === 'DSF' ) ? 56 : 60;
	$bin = file_get_contents( $file, false, NULL, $byte, 4 );
	$hex = bin2hex( $bin );
	if ( $ext === 'DSF' ) {
		$hex = str_split( $hex, 2 );
		$hex = array_reverse( $hex );
		$hex = implode( '', $hex );
	}
	$bitrate = hexdec( $hex );
	$dsd = $bitrate / 44100;
	$bitrate = round( $bitrate / 1000000, 2 );
	$sampling = '1 bit DSD'.$dsd.' - '.$bitrate.' Mbit/s';
} else {
	$data = shell_exec( '/usr/bin/ffprobe -v quiet -select_streams a:0 -show_entries stream=bits_per_raw_sample,sample_rate -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "'.$file.'"' );
	$data = explode( "\n", $data );
	$bitdepth = $data[ 1 ];
	$samplerate = $data[ 0 ];
	$bitrate = $data[ 2 ];
	$sampling = $bitrate ? samplingline( $bitdepth, $samplerate, $bitrate ) : '';
}
$status[ 'sampling' ] = $sampling;

echo json_encode( $status, JSON_NUMERIC_CHECK );
