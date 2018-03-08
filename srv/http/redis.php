<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

$cmd = $_POST[ 'cmd' ];
$key = $_POST[ 'key' ];
$value = $_POST[ 'value' ];
$hash = $_POST[ 'hash' ];

if ( $cmd === 'set' ) {
	$redis->set( $key, $value );
} else if ( $cmd === 'get' ) {
	echo $redis->get( $key );
	if ( isset( $_POST[ 'del' ] ) ) $redis->del( $key );
} else if ( $cmd === 'del' ) {
	$redis->del( $key );
} else if ( $cmd === 'hset' ) {
	$redis->hSet( $key, $hash, $value );
} else if ( $cmd === 'hget' ) {
	echo $redis->hGet( $key, $hash );
	if ( isset( $_POST[ 'del' ] ) ) $redis->hDel( $key );
} else if ( $cmd === 'hdel' ) {
	$redis->hDel( $key, $hash );
}
