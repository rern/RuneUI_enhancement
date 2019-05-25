<?php
$redis = new Redis(); 
$redis->connect( '127.0.0.1' );
$apikey = $redis->get( 'lastfm_apikey' );
$artist = $_GET[ 'artist' ];

$ch = curl_init();
curl_setopt( $ch, CURLOPT_URL, 'http://ws.audioscrobbler.com/2.0/?api_key='.$apikey.'&autocorrect=1&format=json&method=artist.getinfo&artist='.urlencode( $artist ) );
curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 ); //return the transfer as a string 
$data = curl_exec( $ch );
curl_close( $ch );

$data = preg_replace( '/\\\\n/', '<br>', $data );
$data = preg_replace( '/\\\\"/', '&quot;', $data );

$data = json_decode( $data, True );
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
		<div style="clear: both;"></div>
		<br>
		<a>Genre: </a>'.$genre.'<span style="float: right;">Source: last.fm</span><br>
		<br>
		<a>Similar Artists:</a> <span>(click for bio of artists)</span><br>
		<br>
		'.$similars.'
	</form>
';
