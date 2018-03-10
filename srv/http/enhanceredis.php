<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

$array = json_decode( $_POST[ 'json' ], true );

foreach ( $array as $field => $arg ) {
	$count = count( $arg );
	if ( $count === 2 ) {
		$result[ $field ] = $redis->$arg[ 0 ]( $arg[ 1 ] );
	} else if ( $count === 3 ) {
		$result[ $field ] = $redis->$arg[ 0 ]( $arg[ 1 ], $arg[ 2 ] );
	} else if ( $count === 4 ) {
		$result[ $field ] = $redis->$arg[ 0 ]( $arg[ 1 ], $arg[ 2 ], $arg[ 3 ] );
	} else {
		$result[ $field ] = 'Wrong argument numbers.';
	}
}

echo json_encode( $result );
