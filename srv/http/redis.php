<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

$array = json_decode( $_POST[ 'json' ], true );

foreach ( $array as $field => $arg ) {
	$cmd = $arg[ 'cmd' ];
	$key = $arg[ 'key' ];
	$hash = $arg[ 'hash' ];
	$value = $arg[ 'value' ];
	
	if ( $cmd == 'set' || $cmd == 'hmset' ) {
		$result[ $field ] = $redis->$cmd( $key, $value );
	} else if ( $cmd == 'get' || $cmd == 'hGetAll' || $cmd == 'del' ) {
		$result[ $field ] = $redis->$cmd( $key );
	} else if ( $cmd == 'hSet' ) {
		$result[ $field ] = $redis->$cmd( $key, $hash, $value );
	} else if ( $cmd == 'hGet' || $cmd == 'hDel' ) {
		$result[ $field ] = $redis->$cmd( $key, $hash );
	} 
}

echo json_encode( $result );
