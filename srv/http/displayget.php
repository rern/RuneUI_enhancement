<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

$display = $redis->hGetAll( 'display' );
if ( $redis->get( 'volume' ) == 0 ) $display[ 'volume' ] = '';
echo json_encode( $display );
