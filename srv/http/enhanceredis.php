<?php
// json: command = { dataid: [ 'command', 'key', ['hash',] 'value' ] }
// bash: command = { dataid: [ '/fullpath/command argument' ] }
//
// $.post( '/enhanceredis.php', { JSON.stringify( command ) }, ...

// single bash
if ( isset( $_POST[ 'bash' ] ) ) {
	$result = exec( '/usr/bin/sudo '.$_POST[ 'bash' ] );
	echo $result;
	die();
}

$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

// radioname
if ( isset( $_POST[ 'radio' ] ) ) {
	$webradios = $redis->hgetall( 'webradios' );
	$radio = json_decode( $_POST[ 'radio' ] );
	if ( substr( $radio[ 0 ], 0, 4 ) === 'http' ) $webradios = array_flip( $webradios );
	foreach( $radio as $val ) {
		$list[] = $webradios[ $val ];
	}
	echo json_encode( $list );
	die();
}


$array = json_decode( $_POST[ 'json' ], true );

foreach ( $array as $field => $arg ) {
	$count = count( $arg );
	$command = $arg[ 0 ];
	$key = $arg[ 1 ];
	
	if ( $count === 1 ) { // for bash
		$result[ $field ] = exec( '/usr/bin/sudo '.$command );
	} else if ( $count === 2 ) {
		$result[ $field ] = $redis->$command( $key );
	} else if ( $count === 3 ) {
		$result[ $field ] = $redis->$command( $key, $arg[ 2 ] );
	} else if ( $count === 4 ) {
		$result[ $field ] = $redis->$command( $key, $arg[ 2 ], $arg[ 3 ] );
	}
}

echo json_encode( $result );
