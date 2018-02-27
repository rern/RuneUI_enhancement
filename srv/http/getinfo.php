<?php
$artist = $_POST[ 'artist' ];;

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, "http://ws.audioscrobbler.com/2.0/?method=artist.getinfo&artist=$artist&api_key=ba8ad00468a50732a3860832eaed0882&format=json" ); // set url
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 ); //return the transfer as a string 
$data = curl_exec( $ch );
curl_close( $ch );

$summary = preg_replace( '/.*"summary":"(.*) <a .*"content".*/', '${1}', $data );
$summaryhtml = preg_replace( '/\\\\n/', '<br>', $summary );

echo $summaryhtml;
