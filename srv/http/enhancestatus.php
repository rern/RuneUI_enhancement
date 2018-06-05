<?php
include( '/srv/http/app/libs/runeaudio.php' );
$mpd = openMpdSocket('/run/mpd.sock');

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
	."status\n"
	."currentsong\n"
	."command_list_end";
sendMpdCommand( $mpd, $cmdlist );
$status = readMpdResponse( $mpd );
$status = arrayLines( $status );
if ( isset( $status[ 'error' ] ) && $status[ 'state' ] !== 'stop' ) {
	sendMpdCommand( $mpd, 'stop' );
	$output = array( 'icon' => 'fa fa-exclamation-circle', 'title' => 'MPD Error', 'text' => $status[ 'error' ] );
	ui_render( 'notify', json_encode( $output ) );
}

$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );
$status[ 'volumemute' ] = $redis->get( 'volumemute' );

$file = $status[ 'file' ];
$pathinfo = pathinfo( $file );
$ext = strtoupper( $pathinfo[ 'extension' ] );
$status[ 'ext' ] = ( substr($file, 0, 4 ) !== 'http' ) ? $ext : 'radio';

if ( $status[ 'ext' ] === 'radio' && $status[ 'state' ] === 'play' ) {
	$bitdepth = ( $status[ 'ext' ] === 'radio' ) ? '' : $status[ 'bitdepth' ];
	$sampling = samplingline( $bitdepth, $status[ 'samplerate' ], $status[ 'bitrate' ] );
	$status[ 'sampling' ] = $sampling;
	echo json_encode( $status );
	// save only webradio: update sampling database on each play
	$redis->hSet( 'sampling', $file, $sampling );
	die();
}

// state: stop >>>>>>>>>>
// webradio
if ( $status[ 'ext' ] === 'radio' ) {
	if ( $sampling = $redis->hGet( 'sampling', $file ) ) $status[ 'sampling' ] = $sampling;
	$status[ 'Artist' ] = isset( $status[ 'Name' ] ) ? $status[ 'Name' ] : $status[ 'Tile' ];
	$status[ 'Title' ] = '';
	$status[ 'Album' ] = $file;
	$status[ 'time' ] = '';
	$status[ 'elapsed' ] = '';
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
