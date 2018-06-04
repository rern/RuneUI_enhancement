<?php

// 64
//$file = "/mnt/MPD/USB/_Lossless/Alan Parsons Project, The [DSD]/1980 - The Turn Of A Friendly Card/03 - Time.dsf";
// 128
//$file = "/mnt/MPD/USB/_Lossless/Alexis Cole - A Kiss In The Dark [DSD]/01-Ain't We Got Fun.dsf";
// 256
//$file = "/mnt/MPD/USB/_Lossless/Arne Domnerus - Jazz At The Pawnshop - Late Night [DSD]/04 - Mood Indigo.dsf";

include( '/srv/http/app/libs/runeaudio.php' );
$mpd = openMpdSocket('/run/mpd.sock');
$cmdlist = "command_list_begin\n"
	."status\n"
	."currentsong\n"
	."command_list_end";
sendMpdCommand( $mpd, $cmdlist );
$status = readMpdResponse( $mpd );
$status = arrayLines( $status );
if ( $status[ 'state' ] !== 'stop' ) {
	echo json_encode( $status );
	die();
}

// state: stop
$file = '/mnt/MPD/'.$status[ 'file' ];
$ext = strtoupper( pathinfo( $file, PATHINFO_EXTENSION ) );

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
	$sampling = '1 bit DSD '.$dsd.' - '.$bitrate.' Mbit/s';
} else {
	$data = shell_exec( '/usr/bin/ffprobe -v quiet -select_streams a:0 -show_entries stream=bits_per_raw_sample,sample_rate -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "'.$file.'"' );
	$data = explode( "\n", $data );
	$bitdepth = $data[1];
	$samplerate = $data[0];
	$bitrate = $data[2];
	
	if ( !$bitrate ) {
		$sampling= '';
	} else {
		if ( $bitdepth == 'N/A' ) {
			$bitdepth = ( $ext === 'WAV' || $ext === 'AIFF' ) ? ( $bitrate / $samplerate / 2 ).' bit ' : '';
		} else {
			$bitdepth = $bitdepth ? $bitdepth.' bit ' : '';
		}
		$samplerate = round( $samplerate / 1000, 1 ).' kHz ';
		if ( $bitrate < 1000000 ) {
			$bitrate = round( $bitrate / 1000, 0 ).' kbit/s';
		} else {
			$bitrate = round( $bitrate / 1000000, 2 ).' Mbit/s';
		}
		$sampling = $bitdepth.$samplerate.$bitrate;
	}
}
if ( $status[ 'file' ], 0, 4 ) === 'http' && !isset( $status[ 'Name' ] ) {
	$status[ 'Name' ] = $status[ 'Tile' ];
	$status[ 'Tile' ] = '';
}
$status[ 'time' ] = 0;
$status[ 'elapsed' ] = 0;
$status[ 'sampling' ] = $sampling;

echo json_encode( $status );
