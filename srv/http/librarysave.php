<?php
$library = array( 'network' => $_POST[ 'network' ] ? 'checked' : '' );
$library[ 'usb'] = $_POST[ 'usb' ] ? 'checked' : '';
$library[ 'webradios' ] = $_POST[ 'webradios' ] ? 'checked' : '';
$library[ 'albums' ] = $_POST[ 'albums' ] ? 'checked' : '';
$library[ 'artists' ] = $_POST[ 'artists' ] ? 'checked' : '';
$library[ 'composers' ] = $_POST[ 'composers' ] ? 'checked' : '';
$library[ 'genres' ] = $_POST[ 'genres' ] ? 'checked' : '';
$library[ 'spotify' ] = $_POST[ 'spotify' ] ? 'checked' : '';
$library[ 'dirble' ] = $_POST[ 'dirble' ] ? 'checked' : '';
$library[ 'jamendo' ] = $_POST[ 'jamendo' ] ? 'checked' : '';

$redis = new Redis();
$redis->connect( '127.0.0.1' );

$set = $redis->hmset( 'library', $library );

echo $set;
