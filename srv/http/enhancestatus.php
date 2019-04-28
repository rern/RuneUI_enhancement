<?php
if ( !isset( $_POST[ 'statusonly' ] ) ) {
	$redis = new Redis(); 
	$redis->pconnect( '127.0.0.1' );
	$activePlayer = $redis->get( 'activePlayer' );
	$status[ 'activePlayer' ] = $activePlayer;
	$status[ 'volumemute' ] = $redis->hGet( 'display', 'volumemute' );
	if ( $activePlayer === 'Airplay' ) {
		echo json_encode( $status );
		exit();
	}
}

$mpdtelnet = ' | telnet localhost 6600 | sed "/^Trying\|Connected\|Escape\|OK\|Connection\|Date\|Genre\|Last-Modified\|consume\|mixrampdb\|nextsong\|nextsongid/ d"';
$lines = shell_exec( '{ sleep 0.05; echo clearerror; echo status; echo currentsong; sleep 0.05; }'.$mpdtelnet );
// fix: initially add song without play - currentsong = (blank)
if ( strpos( $lines, 'file:' ) === false ) $lines = shell_exec( '{ sleep 0.05; echo status; echo playlistinfo 0; sleep 0.05; }'.$mpdtelnet );

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
		$status[ $key ] = trim( $val );
	}
	$line = strtok( "\n" );
}

$status[ 'updating_db' ] = array_key_exists( 'updating_db', $status ) ? 1 : 0;
$file = '/mnt/MPD/'.$status[ 'file' ];
$pathinfo = pathinfo( $file );
$dir = $pathinfo[ 'dirname' ];
$ext = strtoupper( $pathinfo[ 'extension' ] );
$status[ 'ext' ] = ( substr($status[ 'file' ], 0, 4 ) !== 'http' ) ? $ext : 'radio';

if ( $status[ 'ext' ] !== 'radio' ) {
	// missing id3tags
	if ( empty( $status[ 'Artist' ] ) ) $status[ 'Artist' ] = end( explode( '/', $dir ) );
	if ( empty( $status[ 'Title' ] ) ) $status[ 'Title' ] = $pathinfo[ 'filename' ];
	if ( empty( $status[ 'Album' ] ) ) $status[ 'Album' ] = '';
} else {
	// before webradios play: no 'Name:' - use station name from file instead
	if ( isset( $status[ 'Name' ] ) ) {
		$status[ 'Artist' ] = $status[ 'Name' ];
	} else {
		$urlname = str_replace( '/', '|', $status[ 'file' ] );
		$webradiofile = "/srv/http/assets/img/webradios/$urlname";
		if ( !file_exists( $webradiofile ) ) $webradiofile = "/srv/http/assets/img/webradiopl/$urlname";
		$status[ 'Artist' ] = file( $webradiofile )[ 0 ];
	}
	$status[ 'Title' ] = ( $status[ 'state' ] === 'stop' ) ? '' : $status[ 'Title' ];
	$status[ 'Album' ] = $status[ 'file' ];
	$status[ 'time' ] = '';
}

if ( exec( 'pidof ashuffle' ) ) $status[ 'random' ] = 1;
if ( !array_key_exists( 'song', $status ) ) $status[ 'song' ] = 0;

$previousartist = isset( $_POST[ 'artist' ] ) ? $_POST[ 'artist' ] : '';
$previousalbum = isset( $_POST[ 'album' ] ) ? $_POST[ 'album' ] : '';
if ( isset( $_POST[ 'statusonly' ] )
	|| !$status[ 'playlistlength' ]
	|| ( $status[ 'Artist' ] === $previousartist && $status[ 'Album' ] === $previousalbum )
	&& $status[ 'ext' ] !== 'radio'
) {
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	exit();
}

// coverart
if ( $status[ 'ext' ] !== 'radio' && $activePlayer === 'MPD' ) {
	require_once( '/srv/http/enhancegetcover.php' );
	$status[ 'coverart' ] = getCoverart( $file );
} else if ( $status[ 'ext' ] === 'radio' ) {
	$status[ 'coverart' ] = 0;
	$filename = str_replace( '/', '|', $status[ 'file' ] );
	$file = "/srv/http/assets/img/webradios/$filename";
	if ( !file_exists( $file ) ) $file = "/srv/http/assets/img/webradiopl/$filename";
	if ( file_exists( $file ) ) {
		$content = explode( "\n", trim( file_get_contents( $file ) ) );
		$status[ 'coverart' ] = $content[ 2 ];
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

$webradios = $redis->hGetAll( 'webradios' );
$webradioname = array_flip( $webradios );
$name = $webradioname[ $status[ 'file' ] ];
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
	$sampling = $redis->hGet( 'sampling', $name );
	$status[ 'sampling' ] = $sampling ? $sampling : '&nbsp;';
	echo json_encode( $status, JSON_NUMERIC_CHECK );
	exit();
}
// while stop no mpd info
if ( $ext === 'DSF' || $ext === 'DFF' ) {
	// DSF: byte# 56+4 ? DSF: byte# 60+4
	$byte = ( $ext === 'DSF' ) ? 56 : 60;
	exec( 'hexdump -x -s'.$byte.' -n4 "'.$file.'"', $bin );
	$hex = preg_replace( '/ +/', ' ', $bin[ 0 ] );
	$hex = explode( ' ', $hex );
	$bitrate = hexdec(  $hex[ 2 ].$hex[ 1 ] );
	$dsd = round( $bitrate / 44100 );
	$bitrate = round( $bitrate / 1000000, 2 );
	$sampling = 'DSD'.$dsd.' • '.$bitrate.' Mbit/s';
} else {
	$data = shell_exec( '/usr/bin/ffprobe -v quiet -select_streams a:0 -show_entries stream=bits_per_raw_sample,sample_rate -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "'.$file.'"' );
	$data = explode( "\n", $data );
	$bitdepth = $data[ 1 ];
	$samplerate = $data[ 0 ];
	$bitrate = $data[ 2 ];
	$sampling = $bitrate ? samplingline( $bitdepth, $samplerate, $bitrate ) : '';
}
$status[ 'sampling' ] = $sampling;
$elapsed = exec( '{ sleep 0.01; echo status; sleep 0.01; } | telnet localhost 6600 | grep elapsed | cut -d" " -f2' );
$status[ 'elapsed' ] = round( $elapsed ); // refetch after coverart fetch

echo json_encode( $status, JSON_NUMERIC_CHECK );

function samplingline( $bitdepth, $samplerate, $bitrate ) {
	if ( $bitdepth === 'N/A' ) {
		$bitdepth = ( $ext === 'WAV' || $ext === 'AIFF' ) ? ( $bitrate / $samplerate / 2 ).' bit ' : '';
	} else {
		if ( $bitdepth === 'dsd' ) {
			$dsd = round( $bitrate / 44100 );
			$bitrate = round( $bitrate / 1000000, 2 );
			return 'DSD'.$dsd.' • '.$bitrate.' Mbit/s';
		} else if ( $ext === 'MP3' || $ext === 'AAC' ) {
			$bitdepth = '';
		} else {
			$bitdepth = $bitdepth ? $bitdepth.' bit ' : '';
		}
	}
	$samplerate = round( $samplerate / 1000, 1 ).' kHz ';
	if ( $bitrate < 1000000 ) {
		$bitrate = round( $bitrate / 1000 ).' kbit/s';
	} else {
		$bitrate = round( $bitrate / 1000000, 2 ).' Mbit/s';
	}
	return $bitdepth.$samplerate.$bitrate;
}
