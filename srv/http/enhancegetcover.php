<?php
// create thumbnail from embedded coverart in file
function getID3cover( $file, $thumbnail = 0 ) {
	set_include_path( '/srv/http/app/libs/vendor/' );
	require_once( 'getid3/audioinfo.class.php' );
	$audioinfo = new AudioInfo();
	$id3tag = $audioinfo->Info( $file );
	if ( isset( $id3tag[ 'comments' ][ 'picture' ][ 0 ][ 'data' ] ) ) {
		$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
		$coverdata = $id3cover[ 'data' ];
		$coverext = str_replace( 'image/', '', $id3cover[ 'image_mime' ] );
		if ( !$thumbnail ) {
			return 'data:image/'. $coverext.';base64,'.base64_encode( $coverdata );
		} else {
			$coverfile = "/srv/http/tmp/cover.$coverext";
			file_put_contents( $coverfile, $coverdata );
		}
	} else if ( !$thumbnail ) {
		return 0;
	}
}
