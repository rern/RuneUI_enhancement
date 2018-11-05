<?php
function string2array( $lines, $artist, $album, $file ) {
    $line = strtok( $lines, "\n" );
    while ( $line !== false ) {
        $pair = explode( ' ', $line, 2 );
        $key = $pair[ 0 ];
        $value = $pair[ 1 ];
        if ( $key !== 'INDEX' ) {
            $value = preg_replace( '/^"|"\n*\r*$/', '', $value );
            if ( $key === 'FILE' ) {
                $data[ 'file' ] = preg_replace( '/" WAVE\n*\r*$/', '', $value );
            } else if ( $key === 'TRACK' ) {
                $track = $value;
                $li[ 'TRACK' ] = '#'.$track.' • '.$artist.' • '.$album;
            } else if ( $key === 'PERFORMER' ) {
                $li[ 'TRACK' ] = '#'.$track.' • '.$value.' • '.$album;
            } else {
                $li[ $key ] = $value;
            }
        } else {
            sscanf( $value, "%d:%d", $mm, $ss);
            $times[] = $mm * 60 + $ss;
            $data[ 'track' ][] = $li;
            $li = '';
        }
        $line = strtok( "\n" );
    }
    $pathinfo = pathinfo( $data[ 'file' ] );
    $ext = $pathinfo[ 'extension' ];
    $audiofile = str_replace( 'cue', $ext, $file );
    $duration = exec( 'ffprobe -v quiet -select_streams a:0 -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "'.$audiofile.'"' );
    $times[] = round( $duration );
    $timeL = count( $times );
    for( $i = 1; $i < $timeL; $i++ ) {
        $data[ 'track' ][ $i - 1 ][ 'SEC' ] = $times[ $i ] - $times[ $i - 1 ];
    }
    return $data;
}

$file="/mnt/MPD/USB/hdd/Music/_Lossless/Bon Jovi - This House Is Not For Sale (2016)/Bon Jovi - This House Is Not For Sale.cue";
$lines = shell_exec( 'grep -a "^PERFORMER\|^TITLE" "'.$file.'"' );
$line = strtok( $lines, "\n" );
while ( $line !== false ) {
    $pair = explode( ' ', $line, 2 );
    $info[ $pair[ 0 ] ] = preg_replace( '/^"|"\n*\r*$/', '', $pair[ 1 ] );
    $line = strtok( "\n" );
}
$artist = $info[ 'PERFORMER' ];
$album = $info[ 'TITLE' ];
$lines = shell_exec( 'grep -a "^FILE\|^\s\+TRACK\|^\s\+TITLE\|^\s\+PERFORMER\|^\s\+INDEX 01" "'.$file.'" | sed "s/^FILE/\^\^FILE/; s/^\s\+\| AUDIO\n*\r*$\|:..\n*\r*$//g; s/^INDEX 01/INDEX/"' );
$lists = explode( '^^', $lines );
array_shift( $lists );

foreach( $lists as $list ) {
	$data[] = string2array( $list, $artist, $album, $file );
}
print_r( $data );
