<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

$display = $redis->hGetAll( 'display' );
$display[ 'volumempd' ] = $redis->get( 'volume' );
echo json_encode( $display );
