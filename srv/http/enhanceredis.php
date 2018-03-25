<?php
$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );

// json: redis = { dataid: [ 'command', 'key', ['hash',] 'value' ] }
// bash: redis = { dataid: [ '/fullpath/command argument' ] }
// curl: redis = { dataid: [ 'curl', 'key', 'value' ] }
//
// $.post( '/enhanceredis.php', { JSON.stringify( redis ) }, ...

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
		$value = $arg[ 2 ];
		if ( $command !== 'curl' ) {
			$result[ $field ] = $redis->$command( $key, $value );
		} else {
			exec( '/usr/bin/sudo /usr/bin/curl -s -v -X POST "http://localhost/pub?id=volume" -d "{ \"'.$key.'\": \"'.$value.'\" }"' );
		}
	} else if ( $count === 4 ) {
		$result[ $field ] = $redis->$command( $key, $arg[ 2 ], $arg[ 3 ] );
	}
}

echo json_encode( $result );
