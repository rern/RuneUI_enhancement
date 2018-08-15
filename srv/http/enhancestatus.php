<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );
$activePlayer = $redis->get( 'activePlayer' );
if ( $activePlayer === 'Airplay' ) {
	$status[ 'activePlayer' ] = $activePlayer;
	echo json_encode( $status );
	die();
}

include '/srv/http/app/libs/runeaudio.php';
$mpd = openMpdSocket('/run/mpd.sock');
if ( !$mpd ) die();

function status2array( $lines ) {
	$line = strtok( $lines, "\n" );
	while ( $line !== false ) {
		$pair = explode( ': ', $line, 2 );
		$key = $pair[ 0 ];
		$val = $pair[ 1 ];
		if ( $key === 'elapsed' ) {
			$val = round( $val );
		} else if ( $key === 'bitrate' ) {
			$val = $val * 1000;
		}
		if ( $key !== 'O' ) $status[ $key ] = $val; // skip 'OK' lines
		if ( $key === 'audio') {
			$audio = explode( ':', $val );
			$status[ 'bitdepth' ] = $audio[ 1 ];
			$status[ 'samplerate' ] = $audio[ 0 ];
		}
		$line = strtok( "\n" );
	}
	if ( array_key_exists( 'bitrate', $status ) ) {
		$sampling = substr( $status[ 'file' ], 0, 4 ) === 'http' ? '' : $status[ 'bitdepth' ].' bit ';
		$sampling.= round( $status[ 'samplerate' ] / 1000, 1 ).' kHz '.$status[ 'bitrate' ].' kbit/s';
		$status[ 'sampling' ] = $sampling;
	} else {
		$status[ 'sampling' ] = '&nbsp;';
	}
	return $status;
}
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

$cmdlist = "command_list_begin\n"
	."clearerror\n"
	."status\n"
	."currentsong\n"
	."command_list_end";
sendMpdCommand( $mpd, $cmdlist );
$status = readMpdResponse( $mpd );
$status = status2array( $status );

// fix: initially add song without play - currentsong = (blank)
if ( !isset( $status[ 'file' ] ) ) {
	sendMpdCommand( $mpd, 'playlistinfo 0' );
	$status0 = readMpdResponse( $mpd );
	$status0 = status2array( $status0 );
	$status = array_merge( $status, $status0 );
	$status[ 'song' ] = 0;
}

if ( isset( $status[ 'error' ] ) && $status[ 'state' ] !== 'stop' ) {
	sendMpdCommand( $mpd, 'stop' );
	$output = array( 'icon' => 'fa fa-exclamation-circle', 'title' => 'MPD Error', 'text' => $status[ 'error' ] );
	ui_render( 'notify', json_encode( $output ) );
}

$file = $status[ 'file' ];
$pathinfo = pathinfo( $file );
$ext = strtoupper( $pathinfo[ 'extension' ] );
$status[ 'ext' ] = ( substr($file, 0, 4 ) !== 'http' ) ? $ext : 'radio';

if ( $status[ 'ext' ] === 'radio' ) {
	// before 1st play: no 'Name:' but 'Title:'= value of 'Name:' instead
	$status[ 'Artist' ] = isset( $status[ 'Name' ] ) ? $status[ 'Name' ] : $status[ 'Tile' ];
	$status[ 'Title' ] = ( $status[ 'state' ] === 'stop' ) ? '&nbsp;' : $status[ 'Title' ];
	$status[ 'Album' ] = $file;
	$status[ 'time' ] = '';
}

$status[ 'activePlayer' ] = $activePlayer;
$status[ 'volumemute' ] = $redis->get( 'volumemute' );
$webradios = $redis->hGetAll( "webradios" );
$webradioname = array_flip( $webradios );
$name = $webradioname[ $file ];

// sampling >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
if ( $status[ 'state' ] === 'play' ) {
	$status[ 'radioelapsed' ] = $redis->hGet( 'display', 'radioelapsed' );
	// lossless - no bitdepth
	$bitdepth = ( $status[ 'ext' ] === 'radio' ) ? '' : $status[ 'bitdepth' ];
	$sampling = samplingline( $bitdepth, $status[ 'samplerate' ], $status[ 'bitrate' ] );
	$status[ 'sampling' ] = $sampling;
	echo json_encode( $status );
	// save only webradio: update sampling database on each play
	$redis->hSet( 'sampling', $name, $sampling );
	die();
}

// state: stop / pause >>>>>>>>>>
// webradio
if ( $status[ 'ext' ] === 'radio' ) {
	$webradios = $redis->hGetAll( 'webradios' );
	$webradioname = array_flip( $webradios );
	$status[ 'Artist' ] = $name;
	if ( $sampling = $redis->hGet( 'sampling', $name ) ) $status[ 'sampling' ] = $sampling;
	echo json_encode( $status );
	die();
}
// file
if ( !isset( $status[ 'Artist' ] ) ) $status[ 'Artist' ] = basename( $pathinfo[ 'dirname' ] );
if ( !isset( $status[ 'Title' ] ) ) $status[ 'Title' ] = $pathinfo[ 'filename' ];
if ( !isset( $status[ 'Album' ] ) ) $status[ 'Album' ] = '&nbsp;';

$file = '/mnt/MPD/'.$file;
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
	$bitdepth = $data[1];
	$samplerate = $data[0];
	$bitrate = $data[2];
	$sampling = $bitrate ? samplingline( $bitdepth, $samplerate, $bitrate ) : '';
}
$status[ 'sampling' ] = $sampling;
echo json_encode( $status );
