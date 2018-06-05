<?php
function arrayLines( $lines ) {
$line = strtok( $lines, "\n" );
while ( $line !== false ) {
	$pair = explode( ': ', $line, 2 );
	$key = $pair[ 0 ];
	$val = ( $key !== 'elapsed' ) ? $pair[ 1 ] : round( $pair[ 1 ] );
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
	$status[ 'sampling' ] = '';
}
	return $status;
}

function addRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' || $data->url === '' ) return;
    
	$file = '/mnt/MPD/Webradio/'.$data->label.'.pls';
	$newpls = "[playlist]\n"
		."NumberOfEntries=1\n"
		."File1=".$data->url."\n"
		."Title1=".$data->label;
	$fp = fopen( $file, 'w' );
	fwrite( $fp, $newpls );
	fclose( $fp );
	
	ui_notify( 'Webradio', 'Testing URL connection ...' );
	
	sendMpdCommand( $mpd, 'status' );
	$status = readMpdResponse( $mpd );
	$last = arrayLines( $status )[ 'playlistlength' ]; // mpd play #position start at 0
	$cmdlist = "command_list_begin\n"
		."stop\n"
		."load \"".html_entity_decode( 'Webradio/'.$data->label.'.pls' )."\"\n"
		."play ".$last."\n"
		."command_list_end";
	sendMpdCommand( $mpd, $cmdlist );
	sleep( 3 );
	$cmdlist = "command_list_begin\n"
		."status\n"
		."currentsong\n"
		."command_list_end";
	sendMpdCommand( $mpd, $cmdlist );
	$status = readMpdResponse( $mpd );
	$sampling = arrayLines( $status )[ 'sampling' ];
	if ( !$sampling ) {
		ui_notify( 'Webradio', "URL Connection FAILED!." );
		unlink( $file );
		$cmdlist = "command_list_begin\n"
			."delete ".$last."\n"
			."update Webradio\n"
			."command_list_end";
		sendMpdCommand( $mpd, $cmdlist );
		return;
	}
	
	ui_notify( 'Webradio', $sampling );
	
	$redis->hSet( 'webradios', $data->label, $data->url );
	$redis->hSet( 'webradiosampling', $data->label, $sampling );
	$redis->hSet( 'webradioname', $data->url, $data->label );
	
	sendMpdCommand( $mpd, 'update Webradio' );
}

function editRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' || $data->url === '' ) return;
	
	if ( !unlink( '/mnt/MPD/Webradio/'.$data->label.'.pls' ) ) return;
	
	$urldel = $redis->hGet('webradios', $data->label );
	$redis->hDel( 'webradioname', $urldel );
	$redis->hDel( 'webradiosampling', $data->label );
	$redis->hDel( 'webradios', $data->label );
	$data->label = $data->newlabel;
	$data->newlabel = null;
	addRadio( $mpd, $redis, $data );
	
	sendMpdCommand($mpd, 'update Webradio');
}
function deleteRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' ) return;
	
	if ( !unlink( '/mnt/MPD/Webradio/'.$data->label ) ) return;
	
	$label = preg_replace( "/.pls$/", '', $data->label );
	$urldel = $redis->hGet( 'webradios', $label );
	$redis->hDel( 'webradioname', $urldel );
	$redis->hDel( 'webradiosampling', $label );
	$redis->hDel( 'webradios', $label );
	
	sendMpdCommand( $mpd, 'update Webradio' );
}
