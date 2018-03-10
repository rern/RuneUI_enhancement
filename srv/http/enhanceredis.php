<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

// 'json' from js:
// redis = { dataid: [ 'command', 'key', 'hash', 'value' ] }
// $.post( '/enhanceredis.php', { JSON.stringify( redis ) }, ...
$array = json_decode( $_POST[ 'json' ], true );

foreach ( $array as $field => $arg ) {
	$count = count( $arg );
	$command = $arg[ 0 ];
	$key = $arg[ 1 ];
	if ( $count === 2 ) {
		$result[ $field ] = $redis->$command( $key );
	} else if ( $count === 3 ) {
		$result[ $field ] = $redis->$command( $key, $arg[ 2 ] );
	} else if ( $count === 4 ) {
		$result[ $field ] = $redis->$command( $key, $arg[ 2 ], $arg[ 3 ] );
	} else {
		$result[ $field ] = 'Wrong argument numbers.';
	}
}

echo json_encode( $result );
