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
		<div id="time-knob">
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
				<button id="repeat" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button" data-cmd="repeat"><i class="fa fa-repeat"></i></button>
				<button id="random" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button" data-cmd="random"><i class="fa fa-random"></i></button>
				<button id="single" class="btn btn-default btn-lg btn-cmd btn-toggle <?php if ($this->activePlayer === 'Spotify'): ?>disabled<?php endif; ?>" type="button" data-cmd="single"><i class="fa fa-single"></i></button>
			</div>
		</div>
		<div id="coverart">
			<div id="divcover">
			<img id="cover-art">
			<input id="cover" type="hidden" value="<?=$this->asset('/img/cover.svg')?>">
			<input id="vu" type="hidden" value="<?=$this->asset('/img/vu.gif')?>">
			<input id="vustop" type="hidden" value="<?=$this->asset('/img/vustop.gif')?>">
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
		<div id="volume-knob" class="<?=$this->volume['divclass'] ?>">
			<div id="volume" data-dynamic="<?=$this->volume['dynamic'] ?>"></div>
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
				<input id="db-search-keyword" class="form-control osk-trigger" type="text">
				<span class="input-group-btn">
					<button id="dbsearchbtn" class="btn btn-default"><i class="fa fa-search"></i></button>
				</span>
			</div>
		</div>
		<div id="db-currentpath">
			<a class="lipath"></a>
			<div id="db-home"><i class="fa fa-library"></i></div><span></span>
			<i id="db-webradio-new" class="fa fa-plus-circle"></i>
		</div>
		<button id="db-search-results" class="btn hide" type="button"><i class="fa fa-times sx"></i></button>
		<i id="db-back" class="fa fa-arrow-left"></i>
	</div>
	<div id="home-blocks" class="row"></div>
	<div id="db-list">
		<ul id="db-entries" class="database"></ul>
		<ul id="db-index" class="index hide">
<?php
$vu = $this->asset('/img/vu.gif');
$vustop = $this->asset('/img/vustop.gif');

$indexarray = range( 'A', 'Z' );
$li = '<li>#</li>';
foreach( $indexarray as $i => $char ) {
if ( $i % 2 === 0 ) {
	$li.= '<li>'.$char."</li>\n";
} else {
	$li.= '<li class="half">'.$char."</li>\n";
}
}
echo $li.str_repeat( "<li>&nbsp;</li>\n", 5 );
?>
		</ul>
	</div>
</div>
<div id="page-playlist" class="page hide" onclick=""> <!-- onclick fix ios safari not recognize click for e.target -->
	<div class="btnlist btnlist-top">
		<div id="pl-home"><i class="fa fa-list-ul sx"></i></div>
		<span id="pl-currentpath" class="hide"></span>
		<span id="pl-count" class="playlist hide"></span>
		<i id="pl-searchbtn" class="fa fa-search"></i>
		<form id="pl-search" class="form-inline hide" method="post" onSubmit="return false;" role="form">
			<div class="input-group">
				<input id="pl-filter" class="form-control osk-trigger" type="text" data-placement="bottom" data-toggle="tooltip">
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
<?php
$indexarray = range( 'A', 'Z' );
$li = '<li>#</li>';
foreach( $indexarray as $i => $char ) {
if ( $i % 2 === 0 ) {
	$li.= '<li>'.$char."</li>\n";
} else {
	$li.= '<li class="half">'.$char."</li>\n";
}
}
echo $li.str_repeat( "<li>&nbsp;</li>\n", 5 );
?>
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
<?php
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
	$htmlcommon = '<a class="menushadow"></a>';
	$htmlcommon.= menuli( $add,         'plus-o',            'Add' );
	$htmlcommon.= menuli( $addplay,     'play-plus-o',       'Add ► Play' );
	$htmlcommon.= menuli( $replace,     'plus-refresh',      'Replace' );
	$htmlcommon.= menuli( $replaceplay, 'play-plus-refresh', 'Replace ► Play' );
	return $htmlcommon;
}
function menucommonsp( $type ) {
	$htmlcommon = '<a class="menushadow"></a>';
	$htmlcommon.= menuli( 'spadd',            'plus-o',            'Add',              $type );
	$htmlcommon.= menuli( 'spaddplay',        'play-plus-o',       'Add ► Play',     $type );
	$htmlcommon.= menuli( 'spreplaceplay', 'play-plus-refresh', 'Replace ► Play', $type );
	return $htmlcommon;
}
$menu = '<div>';
$htmlcommon = menucommon( 'add', 'addplay', 'replace', 'replaceplay' );

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
$html.= menuli( 'dirblesave', 'save', 'Save in Webradios' );
$menu.= menudiv( 'dirble', $html );
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

$html = '<a class="menushadow"></a>';
$html.= menuli( 'pladd',         'plus-o',            'Add' );
$html.= menuli( 'pladdplay',     'play-plus-o',       'Add ► Play' );
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

echo $menu;
?>
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
<?php if ( file_exists('/srv/http/assets/js/lyrics.js') ) include 'lyricscontainer.php';?>
