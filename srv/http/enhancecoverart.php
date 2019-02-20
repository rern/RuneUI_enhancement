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
$path = '/mnt/MPD/USB/hdd/Music/0';

$start = time();

$redis = new Redis();
$redis->pconnect( '127.0.0.1' );
$pathcoverarts = $redis->get( 'pathcoverarts' );
$coverfiles = array(
	  'cover.png', 'cover.jpg', 'folder.png', 'folder.jpg', 'front.png', 'front.jpg'
	, 'Cover.png', 'Cover.jpg', 'Folder.png', 'Folder.jpg', 'Front.png', 'Front.jpg'
);

$ls = shell_exec( 'find "'.$path.'" -type d -not -path "/mnt/MPD/Webradio"' );
$dirs = explode( "\n", rtrim( $ls ) );
$countdirs = count( $dirs );
echo "Find coverarts to create thumbnails in \e[36m".number_format( $countdirs )."\e[0m directories ...\n\n";

// each directory
$countexist = 0;
$countthumb = 0;
$countdummy = 0;
$dirnum = 0;
foreach( $dirs as $dir ) { // >>> dir
	$dirnum++;
	$thumbnail = 0;
	$cuefiles = glob( $dir.'/*.cue' );
	if ( empty( $cuefiles ) ) {
		$cue = 0;
		$filenames = array_slice( scandir( $dir ), 2 ); // remove ., ..
	} else {
		$cue = 1;
		$filenames = $cuefiles;
	}
	$percent = round( $dirnum / $countdirs * 100 );
	echo "$percent% - $dirnum/$countdirs : ".str_replace( '/mnt/MPD/', '', $dir )."\n";
	
	// each file - process only 1st audio file
	foreach( $filenames as $filename ) { // >> files
		$file = $cue ? $filename : "$dir/$filename"; // $cuefiles already has $dir
		if ( !is_file( $file ) ) continue;
			
		$mime = mime_content_type( $file );
		$ext = pathinfo( $file, PATHINFO_EXTENSION );
		// only audio file: mimetype 'audio/xxx' or extension 'mp3'(for wrong-mimetype mp3)
		if ( strpos( $mime, 'audio' ) === 0 || $ext === 'mp3' || $cue ) {
			if ( !$cue ) {
				$filenamempd = str_replace( '/mnt/MPD/', '', $file );
				$tags = exec( 'mpc find -f "%album%^^[%albumartist%|%artist%]" filename "'.$filenamempd.'"' );
			} else {
				$album = exec( 'grep "^TITLE" "'.$file.'" | sed "s/^.* \"\(.*\)\"/\1/"' );
				$artist = exec( 'grep "^PERFORMER" "'.$file.'" | sed "s/^.* \"\(.*\)\"/\1/"' );
				$tags = $album.'^^'.$artist;
			}
			if ( !$tags ) {
				echo "  No ID3 data found.\n\n";
				break; // no tags - end foreach $files
			}
			$tags = str_replace( '/', '|', $tags ); // slash "/" character not allowed in filename
			echo "  \e[36m".str_replace( '^^', "\e[0m • ", $tags )."\n";
			$thumbfile = "$pathcoverarts/$tags.jpg";
			if ( file_exists( $thumbfile ) ) {
				echo "  Thumbnail already exists.\n\n";
				$countexist++;
				$thumbnail = 1;
				break; // thumnail exists - end foreach $files
			}
			// create thumbnail from coverart file in dir
			foreach( $coverfiles as $cover ) { // > cover
				$coverfile = "$dir/$cover";
				if ( file_exists( $coverfile ) ) {
					exec( '
						convert "'.$coverfile.'" \
							-thumbnail 200x200 \
							-unsharp 0x.5 \
							"'.$thumbfile.'"
					' );
					$countthumb++;
					$thumbnail = 1;
					break; // found > converted - end foreach $coverfiles
				}
			}                                  // > cover
			if ( $thumbnail ) {
				echo "  Thumbnail created from file: $filename\n\n";
				break; // end foreach $files
			}
			// create thumbnail from embedded coverart in file
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
				exec( 'convert "'.$coverfile.'" -thumbnail 200x200 -unsharp 0x.5 "'.$thumbfile.'"' );
				unlink( $coverfile );
				echo "  Thumbnail created from embedded ID3: $filename\n\n";
				$countthumb++;
				$thumbnail = 1;
				break; // extracted > converted - end foreach $files
			}
			$anotate =  str_replace( '^^', '\n', $tags ).'\n'.$filename;
			exec( '
				convert /srv/http/assets/img/cover-dummy.svg \
				-resize 200x200 \
				-font /srv/http/assets/fonts/lato/lato-regular-webfont.ttf \
				-pointsize 16 \
				-fill "#e0e7ee" \
				-annotate +10+85 "'.$anotate.'" \
				"'.$thumbfile.'"
			' );
			echo "  Coverart not found. Dummy thumbnail created.\n\n";
			$countdummy++;
			$thumbnail = 1;
			break; // end foreach $files
		}
	}                            // >> files
	if ( !$thumbnail ) echo "  No audio files found.\n\n";
}                          // >>> dir

echo "\nNew thumbnails      : \e[36m".number_format( $countthumb )."\e[0m\n";
if ( $countdummy ) echo "Dummy thumbnails    : \e[36m".number_format( $countdummy )."\e[0m.\n";
if ( $countexist ) echo "Existing thumbnails : \e[36m".number_format( $countexist )."\e[0m\n";
echo "Directories         : \e[36m".number_format( $countdirs )."\e[0m\n";
echo "Running time        : \e[36m".gmdate( 'H:i:s', time() - $start )."\e[0m\n";

$ch = curl_init( 'http://localhost/pub?id=notify' );
curl_setopt( $ch, CURLOPT_HTTPHEADER, array( 'Content-Type:application/json' ) );
curl_setopt( $ch, CURLOPT_POSTFIELDS, json_encode( 
	array( 
		  'title' => 'Coverart Browsing'
		, 'text'  => 'Thumbnails updated / created.'
	) 
) );
curl_exec( $ch );
curl_close( $ch );
