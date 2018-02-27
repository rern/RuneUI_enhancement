<?php
$artist = $_GET[ 'artist' ];

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=$artist&api_key=ba8ad00468a50732a3860832eaed0882&format=json" );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 ); //return the transfer as a string 
$data = curl_exec( $ch );
curl_close( $ch );

$data = preg_replace( '/\\\\n/', '<br>', $data );
$data = preg_replace( '/\\\\"/', '&quot;', $data );

$data = json_decode( $data, True );
$image = $data[ 'artist' ][ 'image' ][ 2 ][ '#text' ];
$summary = $data[ 'artist' ][ 'bio' ][ 'summary' ];
$content = $data[ 'artist' ][ 'bio' ][ 'content' ];
$similar =  $data[ 'artist' ][ 'similar' ][ 'artist' ];
$similars = '<a>Similar Artists:</a>';
foreach ( $similar as $name ) {
	$similars .= '<br>'.$name[ 'name' ];
}

$info = array(
	'image'   => $image,
	'bio'     => $summary,
	'biofull' => $content,
	'addinfo' => $similars
);

echo json_encode( $info );
