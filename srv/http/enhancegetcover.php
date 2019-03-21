<?php
if ( isset( $_POST[ 'path' ] ) ) {
	$dir = '/mnt/MPD/'.$_POST[ 'path' ];
	$files = array_slice( scandir( $dir ), 2 ); // remove ., ..
	foreach( $files as $file ) {
		$file = "$dir/$file";
		if ( !is_file( $file ) ) continue;
		
		$mime = substr( mime_content_type( $file ), 0, 5 );
		$ext = substr( $file, -3 );
		if ( $mime === 'audio' || $ext === 'dsf' || $ext === 'dff' ) { // only audio file
			$coverfile = getCoverart( $file, 0, 1 );
			if ( !$coverfile ) continue;
			
			$coverext = substr( $coverfile, -3 );
			$thumbfile = '/srv/http/tmp/tmp.jpg';
			exec( '/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
			$coverart = file_get_contents( $thumbfile );
			echo 'data:image/'. $coverext.';base64,'.base64_encode( $coverart );
			exit;
		}
	}
}
// create thumbnail from embedded coverart in file
function getCoverart( $file, $thumbnail = 0, $asfile = 0 ) {
// 1. local coverart file
	if ( !$thumbnail ) {
		$dir = dirname( $file );
		$coverfiles = array(
			  'cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'front.jpg', 'front.png'
			, 'Cover.jpg', 'Cover.png', 'Folder.jpg', 'Folder.png', 'Front.jpg', 'Front.png'
		);
		foreach( $coverfiles as $cover ) {
			$coverfile = $dir.'/'.$cover;
			if ( file_exists( $coverfile ) ) {
				$coverext = pathinfo( $cover, PATHINFO_EXTENSION );
				if ( $asfile ) return $coverfile;
				
				$coverart = file_get_contents( $coverfile );
				return 'data:image/'. $coverext.';base64,'.base64_encode( $coverart );
			}
		}
	}
// 2. id3tag
	set_include_path( '/srv/http/app/libs/vendor/' );
	require_once( 'getid3/audioinfo.class.php' );
	$audioinfo = new AudioInfo();
	$id3tag = $audioinfo->Info( $file );
	if ( isset( $id3tag[ 'comments' ][ 'picture' ][ 0 ][ 'data' ] ) ) {
		$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
		$coverdata = $id3cover[ 'data' ];
		$coverext = str_replace( 'image/', '', $id3cover[ 'image_mime' ] );
		if ( !$thumbnail && !$asfile ) {
			return 'data:image/'. $coverext.';base64,'.base64_encode( $coverdata );
		} else {
			$coverfile = "/srv/http/tmp/cover.$coverext";
			file_put_contents( $coverfile, $coverdata );
			return $coverfile;
		}
	} else if ( !$thumbnail ) {
		return 0;
	}
}
