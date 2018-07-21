#!/usr/bin/php
<?php
include('/srv/http/app/libs/runeaudio.php');
$redis = new Redis();
$redis->connect( '/tmp/redis.sock' );
if ( $argv[ 1 ] === 'on' ) {
	wrk_startAirplay( $redis );
	exec( '/usr/bin/systemctl stop mpd' );
} else {
	wrk_stopAirplay($redis);
	exec( '/usr/bin/systemctl start mpd' );
}
exec( '/usr/bin/curl -s -v -X POST "http://localhost/pub?id=playback" -d 1' );
