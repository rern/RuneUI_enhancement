<?php
$apikey = 'ba8ad00468a50732a3860832eaed0882';
$artist = $_GET[ 'artist' ];
$method = '&method=artist.getinfo&artist='.urlencode( $artist );

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, 'http://ws.audioscrobbler.com/2.0/?format=json&api_key='.$apikey.$method );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 ); //return the transfer as a string 
$data = curl_exec( $ch );
curl_close( $ch );

$data = preg_replace( '/\\\\n/', '<br>', $data );
$data = preg_replace( '/\\\\"/', '&quot;', $data );

$data = json_decode( $data, True );
print_r($data['album']);
$data = $data[ 'artist' ];
$image = $data[ 'image' ][ 5 ][ '#text' ];
$genre = ucwords( $data[ 'tags' ][ 'tag' ][ 0 ][ 'name' ] );
$content = preg_replace( '/ <a.*Read more on Last.fm.*/', '', $data[ 'bio' ][ 'content' ] );
$similar =  $data[ 'similar' ][ 'artist' ];
$similars = '';
foreach ( $similar as $name ) {
	$similars.= '
		<div class="biosimilar">
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
		</p>
		<br>
		<a>Genre: </a>'.$genre.'<span style="float: right;">Source: last.fm</span><br>
		<br>
		<a>Similar Artists:</a><br>
		<br>
		'.$similars.'
	</form>
';
