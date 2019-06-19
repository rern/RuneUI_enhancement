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
$content = $data[ 'bio' ][ 'content' ];
if ( !$content ) die( 0 );

$content = preg_replace(
	  array( '/^<br><br>/', '/^<br>/', '/ <a.*Read more on Last.fm.*/' )
	, array( '',            '',        '' )
	, $content
);
$genre = ucwords( $data[ 'tags' ][ 'tag' ][ 0 ][ 'name' ] );
if ( $genre ) $genre = '<i class="fa fa-genre fa-lg gr"></i>&ensp;'.$genre;
$similar =  $data[ 'similar' ][ 'artist' ];
if ( $similar ) {
	$similars = '<br><p><i class="fa fa-artist fa-lg gr"></i>&ensp;Similar Artists: <i class="fa fa-external-link gr"></i><p><span>';
	foreach ( $similar as $name ) {
		$similars.= '<a class="biosimilar">'.$name[ 'name' ].'</a>,&ensp;';
	}
	$similars = substr( $similars, 0, -7 ).'</span>';
}
$data = array(
	  'html' => '<form class="form-horizontal">
					<img id="bioimg">
					<a class="artist">'.$artist.'</a>
					<p>'.$content.'</p>
					<div style="clear: both;"></div>
					<br>
					<p>'.$genre.'<span style="float: right;">Text: last.fm'.( $image ? '<br>Image: fanart.tv</span>' : '' ).'</p>
					'.$similars.'
					<br><br>
				</form>'
	, 'imgurl' => 'https://webservice.fanart.tv/v3/music/'.$data[ 'mbid' ].'&?api_key='.$apikey_f
);
echo json_encode( $data );

function curlGet( $url ) {
	$ch = curl_init( $url );
	curl_setopt( $ch, CURLOPT_RETURNTRANSFER, 1 );
	$response = curl_exec( $ch );
	curl_close( $ch );
	return $response;
}
