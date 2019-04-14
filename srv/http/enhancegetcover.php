<?php
if ( isset( $_POST[ 'path' ] ) ) { 
	getCoverFile( '/mnt/MPD/'.$_POST[ 'path' ] );
}
function getCoverFile( $dir, $scancover = 0 ) { // for new bookmarks and scancover
	$audiofound = 0;
	$files = array_slice( scandir( $dir ), 2 ); // remove ., ..
	foreach( $files as $file ) {
		$file = "$dir/$file";
		if ( !is_file( $file ) ) continue;
		
		$mime = substr( mime_content_type( $file ), 0, 5 );
		$ext = substr( $file, -3 );
		if ( $mime === 'audio' || $ext === 'dsf' || $ext === 'dff' ) { // only audio file
			$audiofound = 1;
			$coverfile = getCoverart( $file, 'asfile', $scancover );
			if ( !$coverfile ) continue;
			
			if ( $scancover ) {
				echo $coverfile;
				exit;
			}
			
			$coverext = substr( $coverfile, -3 );
			$thumbfile = '/srv/http/assets/img/tmp/tmp.jpg';
			exec( '/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
			$coverart = file_get_contents( $thumbfile );
			echo 'data:image/'. $coverext.';base64,'.base64_encode( $coverart );
			exit;
		}
	}
	if ( !$audiofound && $scancover ) echo 'noaudiofile';
}
// create thumbnail from embedded coverart in file
function getCoverart( $file, $asfile = 0, $scancover = 0 ) {
// local file
	$isdir = is_dir( $file );
	$dir = $isdir ? $file : dirname( $file );
	if ( !$scancover ) { // scancover.sh already done this
		$coverfiles = array(
			  'cover.jpg', 'cover.png', 'folder.jpg', 'folder.png', 'front.jpg', 'front.png'
			, 'Cover.jpg', 'Cover.png', 'Folder.jpg', 'Folder.png', 'Front.jpg', 'Front.png'
		);
		foreach( $coverfiles as $cover ) {
			$coverfile = $dir.'/'.$cover;
			if ( file_exists( $coverfile ) ) {
				$coverext = pathinfo( $cover, PATHINFO_EXTENSION );
				if ( !$asfile ) return 'data:image/'. $coverext.';base64,'.base64_encode( file_get_contents( $coverfile ) );
				
				return $coverfile;
			}
		}
	}
// id3tag embedded
	require_once( '/srv/http/app/libs/vendor/getid3/getid3.php' );
	$id3 = new getID3;
	$id3tag = $id3->analyze( $file );
	$id3picture = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
	if ( isset( $id3picture[ 'data' ] ) ) {
		$coverdata = $id3picture[ 'data' ];
		$coverext = str_replace( 'image/', '', $id3picture[ 'image_mime' ] );
		if ( !$asfile ) return 'data:image/'. $coverext.';base64,'.base64_encode( $coverdata );
		
		$coverfile = "/srv/http/assets/img/tmp/cover.$coverext";
		file_put_contents( $coverfile, $coverdata );
		return $coverfile;
	} else {
		return 0;
	}
}
