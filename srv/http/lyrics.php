<?php
$artist = urlencode($_GET['artist']);
$song = urlencode($_GET['song']);

// 1st
$url = "http://makeitpersonal.co/lyrics?artist=$artist&title=$song";
$Lyrics = @file_get_contents($url);
if ($Lyric) die($Lyric);

// 2nd
$url = "http://api.chartlyrics.com/apiv1.asmx/SearchLyricDirect?artist=$artist&song=$song";
// set option > post
$context = stream_context_create(array(
	'http' => array(
		'ignore_errors' => true
	)
));
$contents = file_get_contents($url, false, $context);
// check response code error
$code = http_response_code();
if ($code !== 200) die('(Server temporarily unavailable.)');
// check response trouble
if (strpos($contents, 'SearchLyricDirect: No valid words') !== false) die('(Song name contains all common "stop words".<br>Query was ignored by server.)');
// convert $contents > xml > array for fetching
$parser = xml_parser_create();
xml_parse_into_struct($parser, $contents, $vals, $index);
xml_parser_free($parser);

//$LyricChecksum = $vals[3]['value'];
//$LyricID = $vals[5]['value'];
//$LyricCovertArtUrl = $vals[13]['value'];
$Lyric = $vals[19]['value'];

echo $Lyrics;