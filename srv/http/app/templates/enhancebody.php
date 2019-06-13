<?php
$redis = new Redis();
$redis->pconnect( '127.0.0.1' );

$time = time();
$submenucolor = $redis->hGet( 'display', 'color' ) === '#0095d8' ? '' : '<i class="fa fa-brush-undo submenu gr"></i>';
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
		<img class="logo" src="<?=$this->asset( '/img/runelogo.svg' )?>">
	</a>
</div>
<div id="settings" class="menu hide">
	<span class="menushadow"></span>
	<a href="sources"><i class="fa fa-folder-open-cascade"></i>Sources</a>
	<a href="mpd"><i class="fa fa-mpd"></i>MPD</a>
	<a href="settings"><i class="fa fa-sliders"></i>Settings</a>
	<a href="network"><i class="fa fa-network"></i>Network</a>
	<a href="credits"><i class="fa fa-rune"></i>Credits</a>
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
	<a id="colorok" class="btn btn-primary">OK</a>
</div>
<div id="bio" class="hide">
	<div class="container">
		<h1>BIO</h1><a id="closebio"><i class="fa fa-times close-root"></i></a>
		<p class="hrbl"></p>
		<div id="biocontent"></div>
	</div>
</div>
<div id="splash"><img src="<?=$this->asset( '/img/runelogo.svg' )?>"></div>
<div id="loader" class="hide"><img src="<?=$this->asset( '/img/runelogo.svg' )?>"></div>
<script>var lastfmapikey = "<?=$redis->hGet( 'lastfm', 'apikey' )?>"</script>
<?php 
if ( file_exists('/srv/http/assets/js/lyrics.js') ) include 'lyricscontainer.php';
echo $menu;
?>
