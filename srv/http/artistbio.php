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
$image = $data[ 'artist' ][ 'image' ][ 5 ][ '#text' ];
$content = preg_replace( '/ <a.*Read more on Last.fm.*/', '', $data[ 'artist' ][ 'bio' ][ 'content' ] );
$similar =  $data[ 'artist' ][ 'similar' ][ 'artist' ];
$similars = '<sapn>Similar Artists:</span><br>';
foreach ( $similar as $name ) {
	$similars.= '
		<div id="biosimilar">
			<img src="'.$name[ 'image' ][ 2 ][ '#text' ].'"><br>
			<p>'.$name[ 'name' ].'</p>
		</div>
	';
}

echo '
	<legend>'.$artist.'</legend>
	<form class="form-horizontal">
		<img id="bioimg" src="'.$image.'">
		<p>
			'.$content.'
			<br>
			'.$similars.'
		</p>
	</form>
';
