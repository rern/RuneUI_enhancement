#!/usr/bin/php
<?php

// directory list
//     find 1st audio file
//         none - next directory >>
//     extract album and artist from id3 tag
//         none - next directory >> (assume none for all files in directory)
//     use "album^^artist.jpg" as filename of thumbnail
//     find existing thumbnail
//         already exist - next directory >>
//     find coverart file in directory
//         convert to thumbnail - next directory >>
//     extract from id3 tag
//         convert to thumbnail - next directory >>
//     create from text
//         create dummy thumbnail - next directory >>

$redis = new Redis();
$redis->pconnect( '127.0.0.1' );
$pathcoverarts = $redis->get( 'pathcoverarts' );
$paths = array( '/mnt/MPD/LocalStorage', '/mnt/MPD/NAS', '/mnt/MPD/USB' );
foreach( $paths as $path ) {
	createThumbnail( $path, $pathcoverarts );
}
$ch = curl_init( 'http://localhost/pub?id=coverarts' );
curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( 1 ) );
curl_exec( $ch );
curl_close( $ch );

function listDirs( $path, $pathcoverarts ) {
	$dirs = array();
	$rootdirs = array_slice( scandir( $path ), 2 ); // remove ., ..
	foreach( $rootdirs as $dir ) {
		$dir = "$path/$dir";
		if ( !is_dir( $dir ) || $dir === $pathcoverarts ) continue;
		
		$dirs[] = $dir;
		$dirs = array_merge( $dirs, listDirs( $dir, $pathcoverarts ) );
	}
	return $dirs;
}
function createThumbnail( $path, $pathcoverarts ) {
	$dirs = listDirs( $path, $pathcoverarts );
	if ( !count( $dirs ) ) return;
	
	$coverfiles = array(
		  'cover.png', 'cover.jpg', 'folder.png', 'folder.jpg', 'front.png', 'front.jpg'
		, 'Cover.png', 'Cover.jpg', 'Folder.png', 'Folder.jpg', 'Front.png', 'Front.jpg'
	);
	// each directory
	foreach( $dirs as $dir ) { // >>> dir
		$created = 0;
		$files = array_slice( scandir( $dir ), 2 ); // remove ., ..
		// each file - process only 1st audio file
		foreach( $files as $file ) { // >> files
			$file = "$dir/$file";
			if ( !is_file( $file ) ) continue;
				
			$mime = mime_content_type( $file );
			if ( strpos( $mime, 'audio' ) === 0 ) { // only audio file ($mime = 'audio/xxx')
				$filename = str_replace( '/mnt/MPD/', '', $file );
				$tags = exec( 'mpc find -f "%album%^^%albumartist%" filename "'.$filename.'"' );
				if ( !$tags ) break; // no tags - end foreach $files
				
				$tags = str_replace( '/', '|', $tags ); // slash "/" character not allowed in filename
				$thumbfile = "$pathcoverarts/$tags.jpg";
				if ( file_exists( $thumbfile ) ) break; // thumnail exists - end foreach $files
				
				// create thumbnail from coverart file
				foreach( $coverfiles as $cover ) { // > cover
					$coverfile = "$dir/$cover";
					if ( file_exists( $coverfile ) ) {
						exec( '
							/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" \
								-thumbnail 200x200 \
								-unsharp 0x.5 \
								"'.$thumbfile.'"
						' );
						$created = 1;
						break; // found > converted - end foreach $coverfiles
					}
				}                                  // > cover
				if ( $created ) break; // end foreach $files
				
				// create thumbnail from embedded coverart
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
					exec( '/usr/bin/sudo /usr/bin/convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
					unlink( $coverfile );
					break; // extracted > converted - end foreach $files
				}
				$anotate =  str_replace( '^^', '\n', $tags );
				exec( '
					/usr/bin/sudo convert /srv/http/assets/img/cover.svg \
					-resize 200x200 \
					-font /srv/http/assets/fonts/lato/lato-regular-webfont.ttf \
					-pointsize 16 \
					-fill "#e0e7ee" \
					-annotate +10+50 "'.$anotate.'" \
					"'.$thumbfile.'"
				' );
				break; // end foreach $files
			}
		}                            // >> files
	}                          // >>> dir
}
