<?php
function addRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' || $data->url === '' ) return;
    
	ui_notify( 'Webradio', 'Testing connection ...' );
	$data = shell_exec( "{ echo play; sleep 3; echo status; echo stop; sleep 0.1; } | telnet localhost 6600 | grep 'bitrate\|audio' | sed 's/^.*: //; s/:.*:.*$//'" );
	$data = explode( "\n", $data );
	if ( !$data[ 0 ] ) {
		ui_notify( 'Webradio', "URL Connection FAILED!." );
		return;
	}
	
	$sampling = round( $data[ 1 ] / 1000 , 1 ).' kHz '.$data[ 0 ].' kbit/s';
	ui_notify( 'Webradio', $sampling );
	
	$redis->hSet( 'webradiosampling', $data->label, $sampling );
	$redis->hSet( 'webradioname', $data->url, $data->label );
	$redis->hSet( 'webradios', $data->label, $data->url );
	
	$file = '/mnt/MPD/Webradio/'.$data->label.'.pls';
	$newpls = "[playlist]\n"
		."NumberOfEntries=1\n"
		."File1=".$data->url."\n"
		."Title1=".$data->label;
	$fp = fopen( $file, 'w' );
	fwrite( $fp, $newpls );
	fclose( $fp );
	
	sendMpdCommand( $mpd, 'update Webradio' );
}

function editRadio( $mpd, $redis, $data ) {
	if ( $data->label === '' || $data->url === '' ) return;
	
	if ( !unlink( '/mnt/MPD/Webradio/'.$data->label.'.pls' ) ) return;
	
	$urldel = $redis->hGet('webradios', $data->label);
	$redis->hDel('webradioname', $urldel);
	$redis->hDel('webradiosampling', $data->label);
	$redis->hDel('webradios', $data->label);
	
	$data->label = $data->newlabel;
	$data->newlabel = null;
	addRadio($mpd, $redis, $data);
	
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
