<?php
$artist = $_POST[ 'artist' ];

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=$artist&api_key=ba8ad00468a50732a3860832eaed0882&format=json" );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 ); //return the transfer as a string 
$data = curl_exec( $ch );
curl_close( $ch );

$data = preg_replace( '/\\\\n/', '<br>', $data );
$summary = preg_replace( '/.*"summary":"(.*) <a .*"content".*/', '${1}', $data );
$content = preg_replace( '/.*"content":"(.*) <a .*/', '${1}', $data );

$bio = array(
	'bio'     => $summaryhtml,
	'biofull' => $content
);

echo json_encode( $bio );
