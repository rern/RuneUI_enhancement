<?php
$display = array( 'bar' => $_POST[ 'bar' ] ? 'checked' : '' );
if ( isset( $_POST[ 'playback' ] ) ) {
	$display[ 'pause'] = $_POST[ 'pause' ] ? 'checked' : '';
	$display[ 'time'] = $_POST[ 'time' ] ? 'checked' : '';
	$display[ 'coverart'] = $_POST[ 'coverart' ] ? 'checked' : '';
	$display[ 'volume'] = $_POST[ 'volume' ] ? 'checked' : '';
	$display[ 'buttons'] = $_POST[ 'buttons' ] ? 'checked' : '';
} else if ( isset( $_POST[ 'library' ] ) ) {
	$display[ 'nas'] = $_POST[ 'nas' ] ? 'checked' : '';
	$display[ 'usb'] = $_POST[ 'usb' ] ? 'checked' : '';
	$display[ 'webradios' ] = $_POST[ 'webradios' ] ? 'checked' : '';
	$display[ 'albums' ] = $_POST[ 'albums' ] ? 'checked' : '';
	$display[ 'artists' ] = $_POST[ 'artists' ] ? 'checked' : '';
	$display[ 'composer' ] = $_POST[ 'composer' ] ? 'checked' : '';
	$display[ 'genre' ] = $_POST[ 'genre' ] ? 'checked' : '';
	$display[ 'spotify' ] = $_POST[ 'spotify' ] ? 'checked' : '';
	$display[ 'dirble' ] = $_POST[ 'dirble' ] ? 'checked' : '';
	$display[ 'jamendo' ] = $_POST[ 'jamendo' ] ? 'checked' : '';
}
$redis = new Redis();
$redis->connect( '127.0.0.1' );

$set = $redis->hmset( 'display', $display );

echo $set;
