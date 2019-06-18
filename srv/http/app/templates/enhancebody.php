<?php
$redis = new Redis();
$redis->pconnect( '127.0.0.1' );

$time = time();
$submenucolor = $redis->hGet( 'display', 'color' ) === 'hsl(200,100%,40%)' ? '' : '<i class="fa fa-brush-undo submenu gr"></i>';
if ( in_array( $_SERVER[ 'REMOTE_ADDR' ], array( '127.0.0.1', '::1' ) ) ) {
	$submenupower = '<i class="fa fa-screenoff submenu"></i>';
} else {
	$submenupower = '<i class="fa fa-reboot submenu"></i>';
}
// counts
$count = exec( '/srv/http/enhancecount.sh' );
$count = explode( ' ', $count );
$counts = array(
	  'artist'      => $count[ 0 ]
	, 'album'       => $count[ 1 ]
	, 'song'        => $count[ 2 ]
	, 'albumartist' => $count[ 3 ]
	, 'composer'    => $count[ 4 ]
	, 'genre'       => $count[ 5 ]
	, 'network'     => $count[ 6 ]
	, 'usbdrive'    => $count[ 7 ]
	, 'webradio'    => $count[ 8 ]
);
// library home blocks
$blocks = array( // 'id' => array( 'path', 'icon', 'name' );
	  'coverart'    => array( 'Coverart',     'coverart',     'CoverArt' )
	, 'sd'          => array( 'LocalStorage', 'microsd',      'SD' )
	, 'usb'         => array( 'USB',          'usbdrive',     'USB' )
	, 'nas'         => array( 'NAS',          'network',      'Network' )
	, 'webradio'    => array( 'Webradio',     'webradio',     'Webradio' )
	, 'album'       => array( 'Album',        'album',        'Album' )
	, 'artist'      => array( 'Artist',       'artist',       'Artist' )
	, 'albumartist' => array( 'AlbumArtist',  'albumartist',  'Album Artist' )
	, 'composer'    => array( 'Composer',     'composer',     'Composer' )
	, 'genre'       => array( 'Genre',        'genre',        'Genre' )
	, 'spotify'     => array( 'Spotify',      'spotify',      'Spotify' )
	, 'dirble'      => array( 'Dirble',       'dirble',       'Dirble' )
	, 'jamendo'     => array( 'Jamendo',      'jamendo',      'Jamendo' )
);
foreach( $blocks as $id => $value ) {
	$browsemode = in_array( $id, array( 'album', 'artist', 'albumartist', 'composer', 'genre', 'coverart' ) ) ? ' data-browsemode="'.$id.'"' : '';
	$plugin = in_array( $id, array( 'spotify', 'dirble', 'jamendo' ) ) ? ' data-plugin="'.$value[ 0 ].'"' : '';
	$count = $counts[ $value[ 1 ] ] ? number_format( $counts[ $value[ 1 ] ] ) : '';
	$blockhtml.= '
		<div class="divblock">
			<div id="home-'.$id.'" class="home-block"'.$browsemode.$plugin.'>
				<a class="lipath">'.$value[ 0 ].'</a>
				<i class="fa fa-'.$value[ 1 ].'"></i>
				<gr>'.$count.'</gr>
				<a class="label">'.$value[ 2 ].'</a>
			</div>
		</div>
	';
}
// bookmarks
$dir = '/srv/http/assets/img/bookmarks';
$files = array_slice( scandir( $dir ), 2 ); // remove ., ..
if ( count( $files ) ) {
	foreach( $files as $file ) {
		$content = file_get_contents( "$dir/$file" );
		if ( substr( $content, 0, 10 ) === 'data:image' ) {
			$iconhtml = '<img class="bkcoverart" src="'.$content.'">';
		} else {
			$iconhtml = '<i class="fa fa-bookmark"></i>'
					   .'<div class="divbklabel"><span class="bklabel label">'.$content.'</span></div>';
		}
		$blockhtml.= '
			<div class="divblock bookmark">
				<div class="home-block home-bookmark">
					<a class="lipath">'.str_replace( '|', '/', $file ).'</a>
					'.$iconhtml.'
				</div>
			</div>
		';
	}
}
// browse by coverart
$files = array_slice( scandir( '/srv/http/assets/img/coverarts' ), 2 );
if ( count( $files ) ) {
	foreach( $files as $file ) {
		$name = substr( $file, 0, -4 );
		$ext = substr( $file, -3 );
		$filename = "$name.$time.$ext";
		// restore /, #, ? replaced by scan.sh
		$name = preg_replace( array( '/\|/', '/{/', '/}/' ), array( '/', '#', '?' ), $name );
		$names = explode( '^^', $name );
		$album = $names[ 0 ];
		$artist = $names[ 1 ];
		$sortalbum = stripLeading( $album );
		$sortartist = stripLeading( $artist );
		$path = $names[ 2 ];
		if ( $redis->hGet( 'display', 'thumbbyartist' ) ) {
			$lists[] = array( $sortartist, $sortalbum, $artist, $album, $filename, $path );
			$index[] = mb_substr( $sortartist, 0, 1, 'UTF-8' );
		} else {
			$lists[] = array( $sortalbum, $sortartist, $album, $artist, $filename, $path );
			$index[] = mb_substr( $sortalbum, 0, 1, 'UTF-8' );
		}
	}
	usort( $lists, function( $a, $b ) {
		return strnatcmp( $a[ 0 ], $b[ 0 ] ) ?: strnatcmp( $a[ 1 ], $b[ 1 ] );
	} );
	$index = array_keys( array_flip( $index ) );
	$coverarthtml = '';
	foreach( $lists as $list ) {
		$lipath = $list[ 5 ] ? '<a class="lipath">'.$list[ 5 ].'</a>' : '';
		$coverfile = str_replace( '"', '%22', $list[ 4 ] );
		// leading + trailing quotes in the same line avoid spaces between divs
		$coverartshtml.= '<div class="coverart">
							'.$lipath.'
							<a class="lisort">'.$list[ 0 ].'</a>
							<div><img class="lazy" data-src="/srv/http/assets/img/coverarts/'.$coverfile.'"></div>
							<span class="coverart1">'.$list[ 2 ].'</span>
							<gr class="coverart2">'.( $list[ 3 ] ?: '&nbsp;' ).'</gr>
						</div>';
	}
	$coverartshtml.= '<a id="indexcover" data-index=\''.json_encode( $index ).'\'></a><p></p>';
} else {
	$coverarthtml = '';
}
$indexarray = range( 'A', 'Z' );
$li = '<li>#</li>';
foreach( $indexarray as $i => $char ) {
	if ( $i % 2 === 0 ) {
		$li.= '<li class="index-'.$char.'">'.$char."</li>\n";
	} else {
		$li.= '<li class="index-'.$char.' half">'.$char."</li>\n";
	}
}
$index = $li.str_repeat( "<li>&nbsp;</li>\n", 5 );
function stripLeading( $string ) {
	$names = strtoupper( strVal( $string ) );
	return preg_replace(
		  array(
			'/^A\s+|^AN\s+|^THE\s+|[^\w\p{L}\p{N}\p{Pd} ~]/u',
			'/\s+|^_/'
		)
		, array(
			'',  // strip articles | non utf-8 normal alphanumerics | tilde(blank data)
			'-'  // fix: php strnatcmp ignores spaces | sort underscore to before 0
		)
		, $names
	);
}
// context menus
function menuli( $command, $icon, $label, $type = '' ) {
	$iconclass = array( 'folder-refresh', 'tag', 'minus-circle', 'lastfm' );
	if ( in_array( $icon, $iconclass ) ) $class = ' class="'.$icon.'"';
	if ( in_array( $label, array( 'Add', 'Random', 'Replace' ) ) ) $submenu = '<i class="fa fa-play-plus submenu"></i>';
	return '<a data-cmd="'.$command.'"'.$class.'><i class="fa fa-'.$icon.'"></i>'.$label.$submenu.'</a>';
}
function menudiv( $id, $html ) {
	return '<div id="context-menu-'.$id.'" class="menu contextmenu hide">'.$html.'</div>';
}
function menucommon( $add, $replace ) {
	$htmlcommon = '<span class="menushadow"></span>';
	$htmlcommon.= '<a data-cmd="'.$add.'"><i class="fa fa-plus-o"></i>Add<i class="fa fa-play-plus submenu" data-cmd="'.$add.'play"></i></a>';
	$htmlcommon.= '<a data-cmd="'.$replace.'" class="replace"><i class="fa fa-replace"></i>Replace<i class="fa fa-play-replace submenu" data-cmd="'.$replace.'play"></i></a>';
	return $htmlcommon;
}

$kid3 = file_exists( '/usr/bin/kid3-cli' );
$menu = '<div>';
$htmlcommon = menucommon( 'add', 'replace' );
$htmlsimilar.= '<a data-cmd="similar"><i class="fa fa-lastfm"></i>Add similar<i class="fa fa-play-plus submenu" data-cmd="similar"></i></a>';

$html = '<span class="menushadow"></span>';
$html.= menuli( 'play',       'play',         'Play' );
$html.= menuli( 'pause',      'pause',        'Pause' );
$html.= menuli( 'stop',       'stop',         'Stop' );
$html.= menuli( 'radiosave',  'save',         'Save in Webradio' );
$html.= menuli( 'savedpladd', 'plus',         'Add to a playlist' );
$html.= menuli( 'remove',     'minus-circle', 'Remove' );
$menu.= menudiv( 'plaction', $html );

$menudiv = '';
$html = $htmlcommon;
$html.= menuli( 'bookmark',  'star',           'Bookmark' );
$html.= menuli( 'update',    'folder-refresh', 'Update database' );
$html.= menuli( 'thumbnail', 'coverart',       'Update thumbnails' );
if ( $kid3 )
$html.= menuli( 'tag',       'tag',            'Tags' );
$menu.= menudiv( 'folder', $html );

$menudiv = '';
$html = menucommon( 'add', 'replace' );
$html.= $htmlsimilar;

if ( $kid3 )
$html.= menuli( 'tag',     'tag',    'Tags' );
$menu.= menudiv( 'file', $html );

$menudiv = '';
$html = $htmlcommon;
$menu.= menudiv( 'filepl', $html );

$menudiv = '';
$html = $htmlcommon;
$html.= $htmlsimilar;
$html.= menuli( 'savedplremove', 'minus-circle', 'Remove' );
if ( $kid3 )
$html.= menuli( 'tag',               'tag',          'Tags' );
$menu.= menudiv( 'filesavedpl', $html );

$menudiv = '';
$html = menucommon( 'add', 'replace' );
$html.= menuli( 'radiosave', 'save', 'Save in Webradio' );
$menu.= menudiv( 'radio', $html );

$menudiv = '';
$html = menucommon( 'wradd', 'wrreplace' );
$html.= menuli( 'wrrename',   'edit-circle',  'Rename' );
$html.= menuli( 'wrcoverart', 'coverart',     'Change coverart' );
$html.= menuli( 'wrdelete',   'minus-circle', 'Delete' );
$menu.= menudiv( 'webradio', $html );

$menudiv = '';
$html = menucommon( 'wradd', 'wrreplace' );
$html.= menuli( 'savedplremove', 'minus-circle', 'Remove' );
$menu.= menudiv( 'webradiopl', $html );

$menudiv = '';
$html = '<span class="menushadow"></span>';
$html.= menucommon( 'pladd', 'plreplace' );
$html.= menuli( 'plrename', 'edit-circle',  'Rename' );
$html.= menuli( 'pldelete', 'minus-circle', 'Delete' );
$menu.= menudiv( 'playlist', $html );

$menudiv = '';
$html = menucommon( 'albumadd', 'albumreplace' );
$menu.= menudiv( 'album', $html );

$menudiv = '';
$html = menucommon( 'artistadd', 'artistreplace' );
$menu.= menudiv( 'artist', $html );

$menudiv = '';
$html = menucommon( 'composeradd', 'composerreplace' );
$menu.= menudiv( 'composer', $html );

$menudiv = '';
$html = menucommon( 'genreadd', 'genrereplace' );
$menu.= menudiv( 'genre', $html );

function menucommonsp( $type ) {
	$html = '<span class="menushadow"></span>';
	$html.= '<a data-cmd="spadd" data-type="'.$type.'"><i class="fa fa-plus-o"></i>Add</a>';
	$html.= '<a data-cmd="spreplace" data-type="'.$type.'"><i class="fa fa-plus-refresh"></i>Replace</a>';
	return $html;
}
$menudiv = '';
$html = menucommonsp( 'spotify-playlist' );
$menu.= menudiv( 'spotify-pl', $html );

$menudiv = '';
$html = menucommonsp( 'spotify-track' );
$menu.= menudiv( 'spotify', $html );

$menu.= '</div>';

$logo = '
	<g>
		<path class="st0" d="M206.4,118.7c2.3,3.8,5.7,7.3,8.1,9.3c3.8,3.1,6.7,2.8,10.2-0.6c4.8-5.5,8.7-8.9,13.2-13.5
			c12.5-12.8,14.4-28.3,13-45.2c-1.9-12.8-1.6-14.3-0.6-23.3c1.2-7.1,0.8-13.6-0.9-20c-0.6-3.4-1.4-3.4-4.6-4
			c-17.2-1.5-32.9,3-47.4,12.3c-5.1,3.1-5,3.7-3.1,9.3c1.3,3.2,2.1,6.7,3.6,9.8c3.8,8.2,4.7,7.9,13.5,6.6c5.6-0.8,10.5-3,17.5-6
			c-2.4,3.5-4.3,7.1-6.6,9.4c-6.6,6.6-15,10.4-23.8,13.1c-4.6,1.4-8-1.1-9.3-5.1c-2.9-7.3-4-13.1-5.4-19.9c-1.3-6-2.5-12.4-2.6-18.5
			c0-4,0-5.6,3.6-8.2c4.3-3,9.4-5.4,14.3-7.4c18.5-7.6,37.3-12.6,57.1-15.9c7.4-1.2,8.9-1.6,8.9,6.1c1.3,20.5-1.9,46.5-0.3,66.2
			c1.4,5.8,1.1,6.8-0.3,13.3c-3.7,17-19.1,38.6-34.3,50.7c-2.1,1.8-4.4,3.1-7.2,4c-9,2.8-10.3,5-14.3-5.2
			C207.5,133.1,206,127,206.4,118.7z"/>
		<path class="st0" d="M201.9,92.2c11.7-2.7,18.4-4.7,27.2-14.1c-0.6,7.8-3.1,15.9-8.8,20.6c-3.8,3.2-5.8,2.9-8.6,0.8
			C208.9,97.6,204.2,94,201.9,92.2z"/>
	</g>
	<g>
		<path class="st1" d="M0,100.9V61.1h2c0.4,0,0.8,0.1,1,0.3s0.3,0.5,0.4,1l0.3,8.4c1.3-3.2,3-5.7,5.1-7.6c2.1-1.8,4.8-2.7,7.9-2.7
			c1.2,0,2.3,0.1,3.3,0.4c1,0.2,2,0.6,2.9,1.1l-0.5,2.6c-0.1,0.4-0.3,0.6-0.8,0.7c-0.2,0-0.4-0.1-0.7-0.2c-0.3-0.1-0.7-0.2-1.1-0.4
			c-0.4-0.1-1-0.2-1.6-0.3c-0.6-0.1-1.4-0.2-2.2-0.2c-3,0-5.5,0.9-7.4,2.8s-3.5,4.5-4.7,8v25.9H0z"/>
		<path class="st1" d="M30.7,86.5V61.1h3.8v25.4c0,3.7,0.9,6.7,2.6,8.8c1.7,2.1,4.3,3.2,7.8,3.2c2.6,0,5-0.7,7.2-2s4.3-3.2,6.1-5.5
			V61.1H62v39.8h-2.1c-0.7,0-1.1-0.4-1.2-1.1l-0.4-5.9c-1.9,2.3-4,4.1-6.4,5.5s-5.1,2.1-8.1,2.1c-2.2,0-4.1-0.3-5.8-1
			c-1.6-0.7-3-1.7-4.1-3s-1.9-2.9-2.5-4.7C31,90.9,30.7,88.8,30.7,86.5z"/>
		<path class="st1" d="M75,100.9V61.1h2.1c0.7,0,1.1,0.3,1.2,1l0.4,5.9c1.8-2.3,3.9-4.1,6.3-5.5s5.1-2.1,8.1-2.1c2.2,0,4.1,0.3,5.8,1
			c1.7,0.7,3,1.7,4.1,3c1.1,1.3,1.9,2.9,2.5,4.7c0.6,1.8,0.8,3.9,0.8,6.3v25.4h-3.8V75.4c0-3.7-0.9-6.7-2.6-8.8
			c-1.7-2.1-4.3-3.2-7.8-3.2c-2.6,0-5,0.7-7.3,2c-2.2,1.3-4.2,3.2-6,5.5v29.9H75V100.9z"/>
		<path class="st1" d="M115.3,80.2c0-2.9,0.4-5.5,1.2-7.9s2-4.5,3.5-6.2s3.4-3.1,5.6-4.1s4.8-1.5,7.6-1.5c2.2,0,4.3,0.4,6.2,1.2
			s3.5,1.9,4.9,3.4c1.4,1.5,2.5,3.3,3.3,5.5s1.2,4.6,1.2,7.4c0,0.6-0.1,1-0.3,1.2s-0.4,0.3-0.8,0.3h-28.6v0.8c0,3,0.4,5.6,1.1,7.9
			s1.7,4.2,3,5.7s2.8,2.7,4.6,3.5s3.8,1.2,6.1,1.2c2,0,3.7-0.2,5.2-0.6s2.7-0.9,3.7-1.5c1-0.5,1.8-1,2.4-1.5c0.6-0.4,1-0.7,1.3-0.7
			s0.6,0.1,0.8,0.4l1,1.3c-0.6,0.8-1.5,1.5-2.5,2.2s-2.2,1.3-3.5,1.8s-2.7,0.9-4.1,1.2c-1.5,0.3-2.9,0.4-4.4,0.4
			c-2.7,0-5.2-0.5-7.4-1.4s-4.2-2.3-5.8-4.1c-1.6-1.8-2.8-4-3.7-6.7S115.3,83.6,115.3,80.2z M119.2,77h26.2c0-2.1-0.3-4-0.9-5.7
			c-0.6-1.7-1.4-3.1-2.5-4.3c-1.1-1.2-2.3-2.1-3.8-2.7s-3.1-1-5-1c-2.1,0-3.9,0.3-5.5,1c-1.6,0.6-3,1.6-4.2,2.8
			c-1.2,1.2-2.1,2.6-2.9,4.3S119.5,74.9,119.2,77z"/>
	</g>
	<g>
		<path class="st1" d="M300.1,91.2c0-1.7,0.5-3.3,1.4-4.7s2.5-2.7,4.5-3.8c2.1-1.1,4.7-1.9,7.9-2.6c3.2-0.6,7.1-1,11.6-1.1v-4.2
			c0-3.7-0.8-6.5-2.4-8.5s-3.9-3-7.1-3c-1.9,0-3.6,0.3-4.9,0.8c-1.3,0.5-2.5,1.1-3.4,1.8c-0.9,0.6-1.7,1.2-2.3,1.8
			c-0.6,0.5-1.1,0.8-1.5,0.8c-0.5,0-1-0.3-1.2-0.8l-0.7-1.2c2.1-2.1,4.3-3.6,6.6-4.7s4.9-1.6,7.8-1.6c2.1,0,4,0.3,5.6,1
			s2.9,1.6,4,2.9c1.1,1.3,1.9,2.8,2.4,4.6c0.5,1.8,0.8,3.8,0.8,6v25.9h-1.5c-0.8,0-1.3-0.4-1.5-1.1l-0.6-5.1c-1.1,1.1-2.2,2-3.3,2.9
			c-1.1,0.9-2.2,1.6-3.4,2.2c-1.2,0.6-2.4,1-3.8,1.3s-2.9,0.4-4.5,0.4c-1.4,0-2.7-0.2-4-0.6s-2.4-1-3.4-1.8s-1.8-1.9-2.4-3.2
			C300.4,94.6,300.1,93,300.1,91.2z M303.9,91.2c0,1.3,0.2,2.5,0.7,3.5c0.4,1,1,1.8,1.7,2.4s1.6,1.1,2.5,1.4s2,0.5,3,0.5
			c1.5,0,2.9-0.2,4.2-0.5c1.3-0.3,2.5-0.8,3.6-1.4s2.1-1.3,3.1-2.1s1.9-1.7,2.8-2.7V81.7c-3.8,0.1-7,0.4-9.8,0.9
			c-2.7,0.5-5,1.1-6.8,1.9s-3.1,1.8-3.9,2.9S303.9,89.7,303.9,91.2z"/>
		<path class="st1" d="M340.2,86.5V61.1h3.8v25.4c0,3.7,0.9,6.7,2.6,8.8c1.7,2.1,4.3,3.2,7.8,3.2c2.6,0,5-0.7,7.2-2s4.3-3.2,6.1-5.5
			V61.1h3.8v39.8h-2.1c-0.7,0-1.1-0.4-1.2-1.1l-0.4-5.9c-1.9,2.3-4,4.1-6.4,5.5s-5.1,2.1-8.1,2.1c-2.2,0-4.1-0.3-5.8-1
			c-1.6-0.7-3-1.7-4.1-3s-1.9-2.9-2.5-4.7C340.5,90.9,340.2,88.8,340.2,86.5z"/>
		<path class="st1" d="M381.5,81.1c0-2.9,0.4-5.6,1.1-8.2s1.9-4.7,3.3-6.6c1.5-1.9,3.3-3.3,5.4-4.4c2.1-1.1,4.6-1.6,7.4-1.6
			c2.7,0,5,0.5,7,1.5s3.7,2.5,5.1,4.4V42.7h3.8v58.2h-2.1c-0.7,0-1.1-0.3-1.2-1l-0.4-6.2c-1.8,2.4-3.8,4.3-6.2,5.7
			c-2.4,1.4-5,2.1-8,2.1c-4.8,0-8.6-1.7-11.3-5.1C382.8,93,381.5,87.9,381.5,81.1z M385.3,81.1c0,5.9,1.1,10.3,3.3,13.1
			c2.2,2.8,5.3,4.2,9.4,4.2c2.6,0,5-0.7,7.2-2s4.1-3.3,5.8-5.7V69.6c-1.5-2.3-3.2-3.9-5.1-4.8s-4-1.4-6.3-1.4s-4.4,0.4-6.2,1.3
			s-3.2,2.1-4.4,3.6c-1.2,1.6-2.1,3.4-2.7,5.6C385.6,76.1,385.3,78.5,385.3,81.1z"/>
		<path class="st1" d="M427.7,47.4c0-0.5,0.1-0.9,0.3-1.4c0.2-0.4,0.4-0.8,0.8-1.2c0.3-0.3,0.7-0.6,1.1-0.8s0.9-0.3,1.4-0.3
			s0.9,0.1,1.3,0.3s0.8,0.4,1.1,0.8c0.3,0.3,0.6,0.7,0.8,1.2c0.2,0.4,0.3,0.9,0.3,1.4s-0.1,0.9-0.3,1.3c-0.2,0.4-0.5,0.8-0.8,1.1
			s-0.7,0.6-1.1,0.8s-0.9,0.3-1.3,0.3s-0.9-0.1-1.3-0.3s-0.8-0.4-1.1-0.8c-0.3-0.3-0.6-0.7-0.8-1.1C427.8,48.3,427.7,47.9,427.7,47.4
			z M429.3,100.9V61.1h3.8v39.8C433.1,100.9,429.3,100.9,429.3,100.9z"/>
		<path class="st1" d="M444.1,81c0-3.1,0.4-5.9,1.2-8.4c0.8-2.5,2-4.7,3.5-6.5s3.4-3.2,5.7-4.1c2.2-1,4.8-1.4,7.6-1.4
			c2.8,0,5.4,0.5,7.6,1.4c2.2,1,4.1,2.3,5.7,4.1c1.5,1.8,2.7,3.9,3.5,6.5c0.8,2.5,1.2,5.3,1.2,8.4s-0.4,5.9-1.2,8.4
			c-0.8,2.5-2,4.7-3.5,6.5s-3.4,3.2-5.7,4.1c-2.2,1-4.8,1.4-7.6,1.4c-2.8,0-5.4-0.5-7.6-1.4c-2.2-1-4.1-2.3-5.7-4.1s-2.7-3.9-3.5-6.5
			C444.5,86.9,444.1,84.1,444.1,81z M447.9,81c0,2.7,0.3,5.1,0.9,7.2s1.5,4,2.7,5.5s2.7,2.7,4.4,3.5s3.8,1.2,6.2,1.2s4.4-0.4,6.2-1.2
			c1.8-0.8,3.3-2,4.4-3.5s2.1-3.4,2.7-5.5s0.9-4.5,0.9-7.2c0-2.6-0.3-5-0.9-7.2s-1.5-4-2.7-5.5s-2.7-2.7-4.4-3.5
			c-1.8-0.8-3.8-1.2-6.2-1.2s-4.4,0.4-6.2,1.2s-3.3,2-4.4,3.5c-1.2,1.5-2.1,3.4-2.7,5.5C448.2,75.9,447.9,78.3,447.9,81z"/>
	</g>';
?>

<div id="menu-top" class="hide">
	<i id="menu-settings" class="fa fa-gear"></i><span id="badge" class="hide"></span>
	<div id="playback-controls">
		<button id="previous" class="btn btn-default btn-cmd"><i class="fa fa-step-backward"></i></button>
		<button id="stop" class="btn btn-default btn-cmd"><i class="fa fa-stop"></i></button>
		<button id="play" class="btn btn-default btn-cmd"><i class="fa fa-play"></i></button>
		<button id="pause" class="btn btn-default btn-cmd"><i class="fa fa-pause"></i></button>
		<button id="next" class="btn btn-default btn-cmd"><i class="fa fa-step-forward"></i></button>
	</div>
	<a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank">
		<svg class="logo" viewBox="0 0 480.2 144.2"><?=$logo ?></svg>
	</a>
</div>
<div id="settings" class="menu hide">
	<span class="menushadow"></span>
	<a href="mpd"><i class="fa fa-mpd"></i>MPD</a>
	<a href="sources"><i class="fa fa-folder-open-cascade"></i>Sources</a>
	<a href="network"><i class="fa fa-network"></i>Network</a>
	<a id="settingsmenu"><i class="fa fa-sliders"></i>Settings<i class="fa fa-rune submenu"></i></a>
	<a id="turnoff"><i class="fa fa-power"></i>Power<?=$submenupower ?></a>
		<?php 
		if ( $this->pwd_protection ) { ?>
	<a href="logout.php"><i class="fa fa-sign-out"></i>Logout</a>
		<?php 
		}
		if ( file_exists( '/srv/http/assets/css/gpio.css' ) ) { ?>
	<a id="gpio"><i class="fa fa-gpio"></i>GPIO<i class="fa fa-gear submenu"></i></a>
		<?php 
		} ?>
	<a id="displaylibrary"><i class="fa fa-library gr"></i>Library Tools</a>
	<a id="displayplayback"><i class="fa fa-play-circle gr"></i>Playback Tools</a>
	<a id="displaycolor"><i class="fa fa-brush gr"></i>Color<?=$submenucolor ?></a>
		<?php
		if ( file_exists( '/srv/http/assets/fonts/addons.ttf' ) ) { ?> 
	<a id="addons"><i class="fa fa-addons"></i>Addons</a>
		<?php 
		} ?>
</div>
<div id="swipebar" class="transparent">
	<i id="swipeL" class="fa fa-left fa-2x"></i>
	<i class="fa fa-reload fa-2x"></i><i class="fa fa-swipe fa-2x"></i><i class="fa fa-gear fa-2x"></i>
	<i id="swipeR" class="fa fa-right fa-2x"></i>
</div>
<div id="swipeR" class="transparent"><i class="fa fa-gear fa-2x"></i></div>
<div id="menu-bottom" class="hide">
	<ul>
		<li id="tab-library"><a><i class="fa fa-library"></i></a></li>
		<li id="tab-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>
		<li id="tab-playlist"><a><i class="fa fa-list-ul"></i></a></li>
	</ul>
</div>

<div id="page-playback" class="page">
	<div id="info">
		<div id="divartist">
			<span id="artist"></span>
		</div>
		<div id="divsong">
			<span id="song"></i></span>
		</div>
		<div id="divalbum">
			<span id="album"></span>
		</div>
		<div id="sampling">
			<div id="divpos">
				<span id="songposition"></span>
				<span id="timepos"></span>
				<i id="posaddons" class="fa fa-addons hide"></i>
				<i id="posupdate" class="fa fa-library blink hide"></i>
				<i id="posrandom" class="fa fa-random hide"></i>
				<i id="posrepeat"></i>
				<i id="posplayer"></i>
				<i id="posgpio" class="fa fa-gpio hide"></i>
			</div>
			<span id="format-bitrate"></span>
		</div>
	</div>
	<div class="row" id="playback-row">
		<div id="time-knob" class="playback-block">
			<div id="time"></div>
			<div id="imode">
				<i id="iaddons" class="fa fa-addons hide"></i>
				<i id="iupdate" class="fa fa-library blink hide"></i>
				<i id="irandom" class="fa fa-random hide"></i>
				<i id="irepeat"></i>
				<i id="iplayer"></i>
				<i id="igpio" class="fa fa-gpio hide"></i>
			</div>
			<img id="controls-time" class="controls hide" src="<?=$this->asset('/img/controls-time.svg')?>">
			<span id="elapsed" class="controls1"></span>
			<span id="total" class="controls1"></span>
			<div id="timeTL" class="timemap"></div>
			<div id="timeT" class="timemap"></div>
			<div id="timeTR" class="timemap"></div>
			<div id="timeL" class="timemap"></div>
			<div id="timeM" class="timemap"></div>
			<div id="timeR" class="timemap"></div>
			<div id="timeBL" class="timemap"></div>
			<div id="timeB" class="timemap"></div>
			<div id="timeBR" class="timemap"></div>
		</div>
		<div id="play-group">
			<div class="btn-group hide">
				<button id="repeat" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button"><i class="fa fa-repeat"></i></button>
				<button id="random" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button"><i class="fa fa-random"></i></button>
				<button id="single" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button"><i class="fa fa-single"></i></button>
			</div>
		</div>
		<div id="coverart" class="playback-block">
			<div id="divcover">
			<img id="cover-art" class="hide">
			<div id="coverartoverlay" class="hide"></div>
			<img id="controls-cover" class="controls hide" src="<?=$this->asset('/img/controls.svg')?>">
			<div id="coverTL" class="covermap r1 c1 ws hs"></div>
			<div id="coverT" class="covermap r1 c2 wl hs"></div>
			<div id="coverTR" class="covermap r1 c3 ws hs"></div>
			<div id="coverL" class="covermap r2 c1 ws hl"></div>
			<div id="coverM" class="covermap r2 c2 wl hl"></div>
			<div id="coverR" class="covermap r2 c3 ws hl"></div>
			<div id="coverBL" class="covermap r3 c1 ws hs"></div>
			<div id="coverB" class="covermap r3 c2 wl hs"></div>
			<div id="coverBR" class="covermap r3 c3 ws hs"></div>
			</div>
		</div>
		<div id="share-group">
			<div class="btn-group hide">
				<button id="share" class="btn btn-default btn-lg" type="button"><i class="fa fa-share"></i></button>
				<button id="bio-open" class="btn btn-default" type="button"><i class="fa fa-bio"></i></button>
			</div>
		</div>
		<div id="volume-knob" class="playback-block">
			<div id="volume"></div>
			<div id="volT" class="volmap"></div>
			<div id="volL" class="volmap"></div>
			<div id="volM" class="volmap"></div>
			<div id="volR" class="volmap"></div>
			<div id="volB" class="volmap"></div>
			<img id="controls-vol" class="controls hide" src="<?=$this->asset('/img/controls-vol.svg')?>">
		</div>
		<div id="vol-group">
			<div class="btn-group hide">
				<button id="voldn" class="btn btn-default btn-lg" type="button"><i class="fa fa-minus"></i></button>
				<button id="volmute" class="btn btn-default btn-lg" type="button"><i class="fa fa-volume"></i></button>
				<button id="volup" class="btn btn-default btn-lg" type="button"><i class="fa fa-plus"></i></button>
			</div>
		</div>
	</div>
</div>

<div id="page-library" class="page hide">
	<div class="btnlist btnlist-top">
		<i id="db-searchbtn" class="fa fa-search"></i>
		<div id="db-search" class="form-inline hide">
			<div class="input-group">
				<input id="db-search-keyword" class="form-control" type="text">
				<span class="input-group-btn">
					<button id="dbsearchbtn" class="btn btn-default"><i class="fa fa-search"></i></button>
				</span>
			</div>
		</div>
		<div id="db-currentpath">
			<a class="lipath"></a>
			<div id="db-home"><i class="fa fa-library"></i></div><span></span>
			<i id="db-webradio-new" class="fa fa-plus-circle hide"></i>
		</div>
		<button id="db-search-close" class="btn hide" type="button"></button>
		<i id="db-back" class="fa fa-arrow-left"></i>
	</div>
	<div id="home-blocks" class="row" data-count="<?=$counts[ 'song' ]?>">
		<div id="divhomeblocks"><?=$blockhtml?></div>
	</div>
	<div id="db-list">
		<ul id="db-entries" class="database"></ul>
		<ul id="db-index" class="index hide"><?=$index?></ul>
		<div id="divcoverarts" class="hide"><?=$coverartshtml ?></div>
	</div>
</div>

<div id="page-playlist" class="page hide">
	<div class="btnlist btnlist-top">
		<div id="pl-home"><i class="fa fa-list-ul sx"></i></div>
		<span id="pl-currentpath" class="hide"></span>
		<span id="pl-count" class="playlist hide"></span>
		<i id="pl-searchbtn" class="fa fa-search"></i>
		<form id="pl-search" class="form-inline hide" method="post" onSubmit="return false;" role="form">
			<div class="input-group">
				<input id="pl-filter" class="form-control" type="text" data-placement="bottom" data-toggle="tooltip">
				<span class="input-group-btn">
					<button id="plsearchbtn" class="btn btn-default" type="button"><i class="fa fa-search"></i></button>
				</span>
			</div>
		</form>
		<div id="pl-manage" class="playlist">
			<i id="plopen" class="fa fa-folder-open fa-lg"></i>
			<i id="plsave" class="fa fa-save fa-lg"></i>
			<i id="plcrop" class="fa fa-crop fa-lg"></i>
			<i id="plconsume" class="fa fa-flash fa-lg"></i>
				<?php if ( file_exists('/srv/http/assets/js/RuneYoutube.js') ) { ?>
			<i id="pl-import-youtube" class="fa fa-youtube-play fa-lg" data-toggle="modal" data-target="#modal-pl-youtube"></i>
				<?php } ?>
			<i id="plclear" class="fa fa-minus-circle fa-lg"></i>
		</div>
		<button id="pl-search-close" class="btn hide" type="button"><i class="fa fa-times sx"></i><span></span></button>
	</div>
	<div id="pl-list">
		<ul id="pl-entries" class="playlist"></ul>
		<ul id="pl-editor" class="hide"></ul>
		<ul id="pl-index" class="index hide"><?=$index?></ul>
		<i id="playlist-empty" class="fa fa-plus-circle playlist hide"></i>
	</div>
</div>

<div id="divcolorpicker" class="hide">
	<i id="colorcancel" class="fa fa-times fa-2x"></i>
	<a id="colorok" class="btn btn-primary">Set</a>
</div>
<div id="bio" class="hide">
	<div class="container">
		<h1>BIO</h1><a id="closebio"><i class="fa fa-times close-root"></i></a>
		<p class="hrbl"></p>
		<div id="biocontent"></div>
	</div>
</div>
<div id="splash"><svg viewBox="0 0 480.2 144.2"><?=$logo ?></svg></div>
<div id="loader" class="hide"><svg viewBox="0 0 480.2 144.2"><?=$logo ?></svg></div>
<script>var lastfmapikey = "<?=$redis->hGet( 'lastfm', 'apikey' )?>"</script>
<?php 
if ( file_exists('/srv/http/assets/js/lyrics.js') ) include 'lyricscontainer.php';
echo $menu;
?>
