<?php
function getInfo( $mpd ) {
sendMpdCommand( $mpd, 'status' );
$status = readMpdResponse( $mpd );
sendMpdCommand( $mpd, 'currentsong' );
$status.= readMpdResponse( $mpd );
$line = strtok( $status, PHP_EOL );
while ( $line !== false ) {
	$pair = explode( ' ', $line );
	$key = substr( $pair[ 0 ], 0, -1 );       // remove ':'
	$val = $pair[ 1 ];
	if ( $key !== 'O' ) $info[ $key ] = $val; // remove 'OK' lines
	if ( $key === 'audio') {
		$audio = explode( ':', $val );
		$info[ 'bitdepth' ] = $audio[ 1 ];
		$info[ 'sampling' ] = $audio[ 0 ];
	}
	$line = strtok( PHP_EOL );
}
if ( array_key_exists( 'bitrate', $info ) ) {
	$samplinginfo = substr( $info[ 'file' ], 0, 4 ) === 'http' ? '' : $info[ 'bitdepth' ].' bit ';
	$samplinginfo.= round( $info[ 'sampling' ] / 1000, 1 ).' kHz '.$info[ 'bitrate' ].' kbit/s';
	$info[ 'samplinginfo' ] = $samplinginfo;
} else {
	$info[ 'samplinginfo' ] = '';
}
	return $info;
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

	ui_notify( 'Webradio', 'Testing connection ...' );
	addToQueue( $mpd, 'Webradio/'.$data->label.'.pls' );
	sleep( 1 );
	$last = getInfo()[ 'playlistlength' ] - 1;
	sendMpdCommand( $mpd, 'play '.$last );
	sleep( 3 );
	$samplinginfo = getInfo()[ 'samplinginfo' ];
	if ( !$samplinginfo ) {
		ui_notify( 'Webradio', "URL Connection FAILED!." );
		unlink( $file );
		return;
	}
	
	ui_notify( 'Webradio', $samplinginfo );
	
	$redis->hSet( 'webradiosampling', $data->label, $samplinginfo );
	$redis->hSet( 'webradioname', $data->url, $data->label );
	$redis->hSet( 'webradios', $data->label, $data->url );
	
	
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
