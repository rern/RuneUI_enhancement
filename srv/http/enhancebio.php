<?php
$redis = new Redis(); 
$redis->connect( '127.0.0.1' );
$apikey_l = $redis->get( 'lastfm_apikey' );
$apikey_f = '06f56465de874e4c75a2e9f0cc284fa3';
$artist = $_GET[ 'artist' ];
$data = curlGet( 'http://ws.audioscrobbler.com/2.0/'
	.'?autocorrect=1&format=json&method=artist.getinfo'
	.'&api_key='.$apikey_l.'&artist='.urlencode( $artist ) );
$data = preg_replace( 
	  array( '/\\\\n/', '/\\\\"/' )
	, array( '<br>',    '&quot;')
	, $data
);
$data = json_decode( $data, True );

$data = $data[ 'artist' ];
$genre = ucwords( $data[ 'tags' ][ 'tag' ][ 0 ][ 'name' ] );
$content = preg_replace(
	  array( '/^<br><br>/', '/^<br>/', '/ <a.*Read more on Last.fm.*/' )
	, array( '',            '',        '' )
	, $data[ 'bio' ][ 'content' ]
);
$similar =  $data[ 'similar' ][ 'artist' ];


$data = curlGet( 'https://webservice.fanart.tv/v3/music/'
	.$data[ 'mbid' ].'&?api_key='.$apikey_f );
$data = json_decode( $data, True );
$image = $data[ 'artistthumb' ][ 0 ][ 'url' ];

$similars = '';
foreach ( $similar as $name ) {
	$similars.= '
		<div class="biosimilar">
			<p>'.$name[ 'name' ].'</p>
		</div>
	';
}
echo '
	<legend>'.$artist.'</legend>
	<form class="form-horizontal">
		<img id="bioimg" src="'.str_replace( '/fanart/', '/preview/', $image ).'">
		<p>
			'.$content.'
		</p>
		<div style="clear: both;"></div>
		<br>
		<a>Genre: </a>'.$genre.'<span style="float: right;">Source: last.fm<br>Images: fanart.tv</span><br>
		<br>
		<a>Similar Artists:</a> <span>(click for bio of artists)</span><br>
		<br>
		'.$similars.'
	</form>
';

function curlGet( $url ) {
	$ch = curl_init( $url );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
	$response = curl_exec( $ch );
	curl_close( $ch );
	return $response;
}
