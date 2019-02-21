#!/usr/bin/php
<?php
// create thumbnail from embedded coverart in file
$file = $argv[ 1 ];

set_include_path( '/srv/http/app/libs/vendor/' );
require_once( 'getid3/audioinfo.class.php' );
$audioinfo = new AudioInfo();
$id3tag = $audioinfo->Info( $file );
if ( isset( $id3tag[ 'comments' ][ 'picture' ][ 0 ][ 'data' ] ) ) {
	$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
	$coverart = $id3cover[ 'data' ];
	$coverext = str_replace( 'image/', '', $id3cover[ 'image_mime' ] );
	$coverfile = "/srv/http/tmp/cover.$coverext";
	file_put_contents( $coverfile, $coverart );
	echo $coverfile;
} else {
	echo 0;
}
