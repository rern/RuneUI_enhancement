#!/usr/bin/php
<?php
set_include_path( '/srv/http/app/libs/vendor/' );
require_once( 'getid3/audioinfo.class.php' );

$redis = new Redis(); 
$redis->pconnect( '127.0.0.1' );
$pathcoverarts = $redis->Get( 'pathcoverarts' );

$paths = array( '/mnt/MPD/LocalStorage', '/mnt/MPD/NAS', '/mnt/MPD/USB' );
foreach( $paths as $path ) {
	createThumbnail( $path, $pathcoverarts );
}
$ch = curl_init( 'http://localhost/pub?id=coverarts' );
curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( 1 ) );
curl_exec( $ch );
curl_close( $ch );

function createThumbnail( $path, $pathcoverarts ) {
	$dirs = array_slice( scandir( $path ), 2 ); // remove ., ..
	if ( !count( $dirs ) ) return;
	
	$coverfiles = array(
		  'cover.png', 'cover.jpg', 'folder.png', 'folder.jpg', 'front.png', 'front.jpg'
		, 'Cover.png', 'Cover.jpg', 'Folder.png', 'Folder.jpg', 'Front.png', 'Front.jpg'
	);
	// each directory
	foreach( $dirs as $dir ) { // >>> dir
		$dir = "$path/$dir";
		if ( !is_dir( $dir ) ) continue;
		
		$files = array_slice( scandir( $dir ), 2 ); // remove ., ..
		// each file - process only 1st audio file
		foreach( $files as $file ) { // >> files
			$file = "$dir/$file";
			if ( !is_file( $file ) ) continue;
				
			$mime = mime_content_type( $file );
			if ( strpos( $mime, 'audio' ) === 0 ) { // only audio file
				$audioinfo = new AudioInfo();
				$id3tag = $audioinfo->Info( $file );
				$tags = $id3tag[ 'tags' ][ 'vorbiscomment' ] ?: ( $id3tag[ 'tags' ][ 'vorbiscomment' ] ?: $id3tag[ 'tags' ][ 'id3v1' ] );
				if ( !$tags ) break; // no tags - end foreach $files
				
				$album = str_replace( '/', '', $tags[ 'album' ][ 0 ] );
				$artist = str_replace( '/', '', $tags[ 'artist' ][ 0 ] );
				$thumbfile = "$pathcoverarts/$album^^$artist.jpg";
				if ( file_exists( $thumbfile ) ) break; // thumnail exists - end foreach $files
				
				// create thumbnail from coverart file
				foreach( $coverfiles as $cover ) { // > cover
					$coverfile = "$dir/$cover";
					if ( file_exists( $coverfile ) ) {
						exec( '/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
						$created = 1;
						break; // found and created - end foreach $coverfiles
					}
				}                                  // > cover
				if ( isset( $created ) || !isset( $id3tag[ 'comments' ][ 'picture' ][ 0 ][ 'data' ] ) ) break; // end foreach $files
				
				// create thumbnail from embedded coverart
				$id3cover = $id3tag[ 'comments' ][ 'picture' ][ 0 ];
				$coverart = $id3cover[ 'data' ];
				$coverext = str_replace( 'image/', '', $id3cover[ 'image_mime' ] );
				$coverfile = "/srv/http/tmp/cover.$coverext";
				file_put_contents( $coverfile, $coverart );
				exec( '/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
				unlink( $coverfile );
				break; // 1st audio file processed - end foreach $files
			}
		}                            // >> files
	}                          // >>> dir
}
