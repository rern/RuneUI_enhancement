<?php
$blocks = array( // 'id' => array( 'path', 'icon', 'name' );
	  'sd'          => array( 'LocalStorage', 'microsd',      'SD' )
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
$blockhtml = '';
foreach( $blocks as $id => $value ) {
	$browsemode = in_array( $id, array( 'album', 'artist', 'albumartist', 'composer', 'genre' ) ) ? ' data-browsemode="'.$id.'"' : '';
	$plugin = in_array( $id, array( 'spotify', 'dirble', 'jamendo' ) ) ? ' data-plugin="'.$value[ 0 ].'"' : '';
	$blockhtml.= '
	<div class="col-md-3">
	<div id="home-'.$id.'" class="home-block"'.$browsemode.$plugin.'><a class="lipath">'.$value[ 0 ].'</a><i class="fa fa-'.$value[ 1 ].'"></i><wh>'.$value[ 2 ].'</wh></div>
	</div>
		';
}
$indexarray = range( 'A', 'Z' );
$li = '<li>#</li>';
foreach( $indexarray as $i => $char ) {
if ( $i % 2 === 0 ) {
	$li.= '<li>'.$char."</li>\n";
} else {
	$li.= '<li class="half">'.$char."</li>\n";
}
}
$index = $li.str_repeat( "<li>&nbsp;</li>\n", 5 );

// context menus
function menuli( $command, $icon, $label, $type ) {
	$type = $type ? ' data-type="'.$type.'"' : '';
	if ( $icon === 'folder-refresh' ) {
		$class = ' class="update"';
	} else if ( substr( $icon, -7 ) === 'refresh' ) {
		$class = ' class="replace"';
	} else if ( $icon === 'lastfm' ) {
		$class = ' class="lastfm"';
	}
	return '<a data-cmd="'.$command.'"'.$type.$class.'><i class="fa fa-'.$icon.'"></i>'.$label.'</a>';
}
function menudiv( $id, $html ) {
	return '<div id="context-menu-'.$id.'" class="menu contextmenu hide">'.$html.'</div>';
}
function menucommon( $add, $addplay, $replace, $replaceplay ) {
	$htmlcommon = '<span class="menushadow"></span>';
	$htmlcommon.= menuli( $add,         'plus-o',            'Add' );
	$htmlcommon.= menuli( $addplay,     'play-plus',       'Add ► Play' );
	$htmlcommon.= menuli( $replace,     'plus-refresh',      'Replace' );
	$htmlcommon.= menuli( $replaceplay, 'play-plus-refresh', 'Replace ► Play' );
	return $htmlcommon;
}
function menucommonsp( $type ) {
	$htmlcommon = '<span class="menushadow"></span>';
	$htmlcommon.= menuli( 'spadd',         'plus-o',            'Add',            $type );
	$htmlcommon.= menuli( 'spaddplay',     'play-plus',       'Add ► Play',     $type );
	$htmlcommon.= menuli( 'spreplaceplay', 'play-plus-refresh', 'Replace ► Play', $type );
	return $htmlcommon;
}
$menu = '<div>';
$htmlcommon = menucommon( 'add', 'addplay', 'replace', 'replaceplay' );

$html = '<span class="menushadow"></span>';
$html.= menuli( 'play',      'play',         'Play' );
$html.= menuli( 'pause',     'pause',        'Pause' );
$html.= menuli( 'stop',      'stop',         'Stop' );
$html.= menuli( 'radiosave', 'save',         'Save in Webradios' );
$html.= menuli( 'remove',    'minus-circle', 'Remove' );
$menu.= menudiv( 'plaction', $html );
$menudiv = '';

$html = $htmlcommon;
$html.= menuli( 'update',   'folder-refresh', 'Update' );
$html.= menuli( 'bookmark', 'star',           'Bookmark' );
$menu.= menudiv( 'folder', $html );
$menudiv = '';
$html = $htmlcommon;
$html.= menuli( 'lastfmreplaceplay', 'lastfm', 'Last.fm playlist' );
$menu.= menudiv( 'file', $html );
$menudiv = '';
$html = $htmlcommon;
$menu.= menudiv( 'filepl', $html );
$menudiv = '';
$html = menucommon( 'add', 'addplay', 'replace', 'replaceplay' );
$html.= menuli( 'radiosave', 'save', 'Save in Webradios' );
$menu.= menudiv( 'radio', $html );
$menudiv = '';
$html = menucommonsp( 'spotify-playlist' );
$menu.= menudiv( 'spotify-pl', $html );
$menudiv = '';
$html = menucommonsp( 'spotify-track' );
$menu.= menudiv( 'spotify', $html );
$menudiv = '';
$html = menucommon( 'wradd', 'wraddplay', 'wrreplace', 'wrreplaceplay' );
$html.= menuli( 'wrrename', 'edit-circle',  'Rename' );
$html.= menuli( 'wrdelete', 'minus-circle', 'Delete' );
$menu.= menudiv( 'webradio', $html );
$menudiv = '';

$html = menucommon( 'wradd', 'wraddplay', 'wrreplace', 'wrreplaceplay' );
$menu.= menudiv( 'webradiopl', $html );
$menudiv = '';

$html = '<span class="menushadow"></span>';
$html.= menuli( 'pladd',         'plus-o',            'Add' );
$html.= menuli( 'pladdplay',     'play-plus',       'Add ► Play' );
$html.= menuli( 'plashuffle',    'play-random',    '+Random ► Play' );
$html.= menuli( 'plreplace',     'plus-refresh',      'Replace' );
$html.= menuli( 'plreplaceplay', 'play-plus-refresh', 'Replace ► Play' );
$html.= menuli( 'plrename',      'edit-circle',       'Rename' );
$html.= menuli( 'pldelete',      'minus-circle',      'Delete' );
$menu.= menudiv( 'playlist', $html );
$menudiv = '';
$html = menucommon( 'albumadd', 'albumaddplay', 'albumreplace', 'albumreplaceplay' );
$menu.= menudiv( 'album', $html );
$menudiv = '';
$html = menucommon( 'artistadd', 'artistaddplay', 'artisrreplace', 'artistreplaceplay' );
$menu.= menudiv( 'artist', $html );
$menudiv = '';
$html = menucommon( 'composeradd', 'composeraddplay', 'composerreplace', 'composerreplaceplay' );
$menu.= menudiv( 'composer', $html );
$menudiv = '';
$html = menucommon( 'genreadd', 'genreaddplay', 'genrereplace', 'genrereplaceplay' );
$menu.= menudiv( 'genre', $html );
$menu.= '</div>';

	if ( empty( $this->uri(1) ) ) { ?>
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
	<a id="debug" href="debug"><i class="fa fa-code"></i>Debug</a>
	<a id="dev" href="dev"><i class="fa fa-gears"></i>Development</a>
	<a id="turnoff"><i class="fa fa-power"></i>Power</a>
		<?php 
		if ( $this->pwd_protection ) { ?>
	<a href="logout.php"><i class="fa fa-sign-out"></i>Logout</a>
		<?php 
		}
		if ( file_exists( '/srv/http/assets/css/gpio.css' ) ) { ?>
	<a id="gpio"><i class="fa fa-gpio"></i>GPIO</a>
		<?php 
		} ?>
	<a id="displaylibrary"><i class="fa fa-library gr"></i>Library Items</a>
	<a id="displayplayback"><i class="fa fa-play-circle gr"></i>Playback Items</a>
		<?php
		if ( file_exists( '/srv/http/assets/fonts/addons.ttf' ) ) { ?> 
	<a id="addons"><i class="fa fa-addons"></i>Addons</a>
		<?php 
		} ?>
</div>
<div id="swipebar" class="transparent"><img src="<?=$this->asset( '/img/swipe.svg' )?>"></div>
<div id="menu-bottom" class="hide">
	<ul>
		<li id="tab-library"><a><i class="fa fa-library"></i></a></li>
		<li id="tab-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>
		<li id="tab-playlist"><a><i class="fa fa-list-ul"></i></a></li>
	</ul>
</div>
<div id="splash"><img src="<?=$this->asset( '/img/runelogo.svg' )?>"></div>
<div id="loader" class="hide"><img src="<?=$this->asset( '/img/runelogo.svg' )?>"></div>
	<?php 
	if ( file_exists('/srv/http/assets/js/lyrics.js') ) include 'lyricscontainer.php';
	} ?>

<div id="page-playback" class="page hide">
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
			<button id="playsource-open" class="btn btn-default btn-xs">MPD</button>
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
			<div class="btn-group">
				<button id="repeat" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button"><i class="fa fa-repeat"></i></button>
				<button id="random" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button"><i class="fa fa-random"></i></button>
				<button id="single" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button"><i class="fa fa-single"></i></button>
			</div>
		</div>
		<div id="coverart" class="playback-block">
			<div id="divcover">
			<img id="cover-art">
			<input id="cover" type="hidden" value="<?=$this->asset('/img/cover.svg')?>">
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
			<div class="btn-group">
				<button id="overlay-social-open" class="btn btn-default btn-lg" type="button"><i class="fa fa-share"></i></button>
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
			<div class="btn-group">
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
		<button id="db-search-results" class="btn hide" type="button"><i class="fa fa-times sx"></i></button>
		<i id="db-back" class="fa fa-arrow-left"></i>
	</div>
	<div id="home-blocks" class="row">
		<div id="divbookmarks"></div>
		<div id="divhomeblocks">
			<?=$blockhtml?>
		</div>
	</div>
	<div id="db-list">
		<ul id="db-entries" class="database"></ul>
		<ul id="db-index" class="index hide">
			<?=$index?>
		</ul>
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
				<?php if ( file_exists('/srv/http/assets/js/RuneYoutube.js') ) { ?>
			<i id="pl-import-youtube" class="fa fa-youtube-play fa-lg" data-toggle="modal" data-target="#modal-pl-youtube"></i>
				<?php } ?>
			<i id="plclear" class="fa fa-minus-circle fa-lg"></i>
		</div>
		<button id="pl-filter-results" class="btn hide" type="button"></button>
	</div>
	<div id="pl-list">
		<ul id="pl-entries" class="playlist"></ul>
		<ul id="pl-editor" class="hide"></ul>
		<ul id="pl-index" class="index hide">
			<?=$index?>
		</ul>
		<div id="playlist-warning" class="playlist hide">
			<i class="fa fa-plus-circle"></i><br>
			<p>Add music from Library</p>
		</div>
	</div>
</div>

<div id="bio" class="hide">
	<div class="container">
		<h1>BIO</h1><a id="closebio"><i class="fa fa-times close-root"></i></a>
		<div id="biocontent">
			<div class="biosimilar"></div>
		</div>
	</div>
</div>
<?=$menu?>
<div id="overlay-social" class="overlay-scale">
    <nav>
        <ul>
            <li><span>Share This Track</span></li>
            <li><a id="urlTwitter" onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;" class="btn btn-default btn-lg btn-block share-twitter"><i class="fa fa-twitter sx"></i> Share on Twitter</a></li>
            <li><a onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;" class="btn btn-default btn-lg btn-block share-facebook" href="https://www.facebook.com/sharer.php?u=http%3A%2F%2Fwww.runeaudio.com%2F&display=popup"><i class="fa fa-facebook sx"></i> Share on Facebook</a></li>
            <li><a onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;" class="btn btn-default btn-lg btn-block share-google-plus" href="https://plus.google.com/share?url=http%3A%2F%2Fwww.runeaudio.com%2F"><i class="fa fa-google-plus sx"></i> Share on Google+</a></li>
            <li><a class="btn btn-default btn-lg btn-block" href="http://www.runeaudio.com/support-us/" target="_blank"><i class="fa fa-heart sx"></i> Support RuneAudio</a></li>
            <li><button id="overlay-social-close" class="btn btn-link" type="button"><i class="fa fa-times"></i> Close</button></li>
        </ul>
    </nav>
</div>
<div id="playsource" class="overlay-scale">
    <nav>
        <ul>
            <li><span>Playback Source</span></li>
			<li><a id="playsource-mpd" class="btn btn-default btn-lg btn-block"><i class="fa fa-mpd sx"></i> MPD</a></li>
			<li><a id="playsource-spotify" class="btn btn-default btn-lg btn-block inactive"><i class="fa fa-spotify sx"></i> <span>spop</span> Spotify</a></li>
			<li><a id="playsource-airplay" class="btn btn-default btn-lg btn-block inactive"><i class="fa fa-airplay sx"></i> <span>ShairPort</span> Airplay</a></li>
			<li><a id="playsource-dlna" class="btn btn-default btn-lg btn-block inactive"><i class="fa fa-dlna sx"></i> <span>upmpdcli</span> DLNA</a></li>
            <li><button id="playsource-close" class="btn btn-link" type="button"><i class="fa fa-times"></i> Close</button></li>
        </ul>
    </nav>
</div>