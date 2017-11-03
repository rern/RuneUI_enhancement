<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

echo json_encode( $redis->hGetAll( 'library' ) );
