<?php
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

function addRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' || $data->url === '' ) return;
    // create .pls file
	$file = '/mnt/MPD/Webradio/'.$data->label.'.pls';
	$newpls = "[playlist]\n"
		."NumberOfEntries=1\n"
		."File1=".$data->url."\n"
		."Title1=".$data->label;
	$fp = fopen( $file, 'w' );
	fwrite( $fp, $newpls );
	fclose( $fp );
	// notify
	$output = array( 'icon' => 'fa fa-refresh fa-spin', 'title' => 'Webradio', 'text' => 'Testing URL connection ...' );
	ui_render( 'notify', json_encode( $output ) );
	// get 'last'
	sendMpdCommand( $mpd, 'status' );
	$status = readMpdResponse( $mpd );
	$last = status2array( $status )[ 'playlistlength' ]; // mpd play #position start at 0
	// play
	$cmdlist = "command_list_begin\n"
		."stop\n"
		."clearerror\n"
		."load \"".html_entity_decode( 'Webradio/'.$data->label.'.pls' )."\"\n"
		."play ".$last."\n"
		."command_list_end";
	sendMpdCommand( $mpd, $cmdlist );
	// get status
	sleep( 3 );
	$cmdlist = "command_list_begin\n"
		."status\n"
		."currentsong\n"
		."command_list_end";
	sendMpdCommand( $mpd, $cmdlist );
	$status = readMpdResponse( $mpd );
	$status = status2array( $status );
	// if failed: notify and delete .pls file
	if ( isset( $status[ 'error' ] ) ) {
		$output = array( 'icon' => 'fa fa-exclamation-circle', 'title' => 'Error', 'text' => $status[ 'error' ] );
		ui_render( 'notify', json_encode( $output ) );
		unlink( $file );
		$cmdlist = "command_list_begin\n"
			."delete ".$last."\n"
			."clearerror\n"
			."update Webradio\n"
			."command_list_end";
		sendMpdCommand( $mpd, $cmdlist );
		return;
	}
	// update database
	$redis->hSet( 'webradios', $data->label, $data->url );
	$redis->hSet( 'webradiosampling', $data->label, $status[ 'sampling' ] );
	
	sendMpdCommand( $mpd, 'update Webradio' );
}

function editRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' || $data->url === '' ) return;
	
	unlink( '/mnt/MPD/Webradio/'.$data->label.'.pls' );
	
	$url = $redis->hGet('webradios', $data->label );
	$sampling = $redis->hGet('webradiosampling', $data->label );
	
	$redis->hDel( 'webradios', $data->label );
	$redis->hDel( 'webradiosampling', $data->label );
	
	if ( $data->url !== $url ) {
		$data->label = $data->newlabel;
		$data->newlabel = null;
		addRadio( $mpd, $redis, $data );
		return;
	}
	
	$redis->hSet( 'webradios', $data->newlabel, $url );
	$redis->hSet( 'webradiosampling', $data->newlabel, $sampling );
	
	sendMpdCommand($mpd, 'update Webradio');
}
function deleteRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' ) return;
	
	unlink( '/mnt/MPD/Webradio/'.$data->label.'.pls' );
	
	$redis->hDel( 'webradios', $data->label );
	$redis->hDel( 'webradiosampling', $data->label );
	
	sendMpdCommand( $mpd, 'update Webradio' );
}
