<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

$redis->set( 'page', isset( $_POST[ 'page' ] ) ? $_POST[ 'page' ] : 'open-playback' );
