<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

if ( $_POST[ 'cmd' ] === 'set' ) {
	$redis->set( $_POST[ 'key' ], $_POST[ 'value' ] );
} else if ( $_POST[ 'cmd' ] === 'get' ) {
	echo $redis->get( $_POST[ 'key' ] );
	if ( isset( $_POST[ 'del' ] ) ) $redis->del( $_POST[ 'key' ] );
} else if ( $_POST[ 'cmd' ] === 'del' ) {
	$redis->del( $_POST[ 'key' ] );
} else if ( $_POST[ 'cmd' ] === 'hset' ) {
	$redis->hSet( $_POST[ 'key' ], $_POST[ 'hash' ], $_POST[ 'value' ] );
} else if ( $_POST[ 'cmd' ] === 'hget' ) {
	echo $redis->hGet( $_POST[ 'key' ], $_POST[ 'hash' ] );
	if ( isset( $_POST[ 'del' ] ) ) $redis->hDel( $_POST[ 'key' ] );
} else if ( $_POST[ 'cmd' ] === 'hdel' ) {
	$redis->hDel( $_POST[ 'key' ], $_POST[ 'hash' ] );
}
