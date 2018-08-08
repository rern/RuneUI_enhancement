<div class="tab-content" id="content">
	<!-- PLAYBACK PANEL -->
	<div id="playback" class="tab-pane active">
		<div id="container-playback">
		
			<div id="info">
				<div id="divartist">
					<span id="currentartist"></span>
				</div>
				<div id="divsong">
					<span id="currentsong"></i></span>
				</div>
				<div id="divalbum">
					<span id="currentalbum"></span>
				</div>
				<div id="sampling">
					<span id="playlist-position"><span></span></span>
					<span id="format-bitrate"></span>
				</div>
			</div>
			<div class="row hide" id="playback-row">
				<div id="time-knob">
					<div id="time"></div>
					<button id="overlay-playsource-open" class="btn btn-default btn-xs">MPD</button>
					<div id="imode">
						<i id="iupdate" class="fa fa-library hide"></i>
						<i id="irandom" class="fa fa-random hide"></i>
						<i id="irepeat" class="fa hide"></i>
						<i id="iplayer" class="fa hide"></i>
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
						<button id="repeat" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button" title="Repeat" data-cmd="repeat"><i class="fa fa-repeat"></i></button>
						<button id="random" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button" title="Random" data-cmd="random"><i class="fa fa-random"></i></button>
						<button id="single" class="btn btn-default btn-lg btn-cmd btn-toggle <?php if ($this->activePlayer === 'Spotify'): ?>disabled<?php endif; ?>" type="button" title="Single" data-cmd="single"><i class="fa fa-single"></i></button>
					</div>
				</div>
				<div id="coverart">
					<img id="cover-art" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7">
					<input id="vu" type="hidden" value="url('..<?=$this->asset('/img/vu.gif')?>')">
					<input id="vustop" type="hidden" value="url('..<?=$this->asset('/img/vustop.gif')?>')">
					<div id="coverartoverlay"></div>
					<img id="controls-cover" class="controls hide" src="<?=$this->asset('/img/controls.svg')?>">
					<div id="coverTL" class="covermap t0 w50 h50 m-115"></div>
					<div id="coverT" class="covermap t0 w130 h50 m-65"></div>
					<div id="coverTR" class="covermap t0 w50 h50 m65"></div>
					<div id="coverL" class="covermap t50 w50 h130 m-115"></div>
					<div id="coverM" class="covermap t50 w130 h130 m-65"></div>
					<div id="coverR" class="covermap t50 w50 h130 m65"></div>
					<div id="coverBL" class="covermap t180 w50 h50 m-115"></div>
					<div id="coverB" class="covermap t180 w130 h50 m-65"></div>
					<div id="coverBR" class="covermap t180 w50 h50 m65"></div>
				</div>
				<div id="share-group">
					<div class="btn-group">
						<button id="overlay-social-open" class="btn btn-default btn-lg" type="button" title="Share this track"><i class="fa fa-share"></i></button>
						<button id="songinfo-open" class="btn btn-default" type="button" title="Song Info" data-toggle="modal"><i class="fa fa-info"></i></button>
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
						<button id="voldn" class="btn btn-default btn-lg" type="button" title="Volume down"><i class="fa fa-minus"></i></button>
						<button id="volmute" class="btn btn-default btn-lg" type="button" title="Volume mute/unmute"><i class="fa fa-volume"></i></button>
						<button id="volup" class="btn btn-default btn-lg" type="button" title="Volume up"><i class="fa fa-plus"></i></button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- LIBRARY PANEL -->
	<div id="panel-sx" class="tab-pane hide">
		<div class="btnlist btnlist-top">
			<div id="db-search" class="form-inline">
				<div class="input-group">
					<input id="db-search-keyword" class="form-control osk-trigger" type="text">
					<span class="input-group-btn">
						<button id="searchbtn" class="btn btn-default" title="Search"><i class="fa fa-search"></i></button>
					</span>
				</div>
			</div>
			<div id="db-currentpath">
				<div id="db-home"><i class="fa fa-library"></i></div> <span>LIBRARY</span>
				<i id="db-webradio-new" class="fa fa-plus-circle"></i>
			</div>
			<button id="db-search-results" class="btn hide" type="button" title="Close search results and go back to the Library browsing"><i class="fa fa-times sx"></i></button>
			<i id="db-level-up" class="fa fa-arrow-left"></i>
		</div>
		<div id="database">
			<ul id="database-entries" class="database">
				<!-- DB entries -->
			</ul>
			<ul id="db-index" class="hide">
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
			<div id="home-blocks" class="row">
				<div class="col-sm-12">
					<h1 class="txtmid"></h1>
				</div>
			</div>
		</div>
		<button id="db-homeSetup" class="btn btn-default hide" type="button" title="Setup the Library home screen"><i class="fa fa-gear"></i></button>
		<div id="spinner-db" class="csspinner duo hide"></div>
	</div>
	<!-- QUEUE PANEL -->
	<div id="panel-dx" class="tab-pane hide">
		<div class="btnlist btnlist-top">
			<div id="pl-home"><i class="fa fa-list-ul sx"></i></div>
			<span id="pl-currentpath" class="hide"> &ensp;PLAYLISTS</span>
			<span id="pl-count" class="hide"></span>
			<form id="pl-search" class="form-inline" method="post" onSubmit="return false;" role="form">
				<div class="input-group">
					<input id="pl-filter" class="form-control osk-trigger" type="text" data-placement="bottom" data-toggle="tooltip" data-original-title="Type here to search on the fly">
					<span class="input-group-btn">
						<button class="btn btn-default" type="button" title="Search"><i class="fa fa-search"></i></button>
					</span>
				</div>
			</form>
			<div id="pl-manage">
				<i id="pl-manage-list" class="fa fa-folder-open fa-lg" title="Manage playlists"></i>
				<i id="plsave" class="fa fa-save fa-lg" title="Save current queue as playlist" data-toggle="modal" data-target="#modal-pl-save"></i>
				<!--<i id="pl-import-youtube" class="fa fa-youtube-play" title="Import a playlist or video from youtube." data-toggle="modal" data-target="#modal-pl-youtube"></i>-->
				<i id="pl-manage-clear" class="fa fa-minus-circle fa-lg" title="Clear the playing queue" data-toggle="modal" data-target="#modal-pl-clear"></i>
			</div>
			<button id="pl-filter-results" class="btn hide" type="button" title="Close filter results and go back to the playing Queue"></button>
		</div>
		<div id="playlist">
			<ul id="playlist-entries" class="playlist">
				<!-- playing queue entries -->
			</ul>
			<ul id="pl-editor" class="playlist hide">
				<!-- playlists -->
			</ul>
			<ul id="pl-detail" class="playlist hide">
				<!-- playlist entries -->
			</ul>
			<div id="playlist-warning" class="playlist hide" style="margin-top: 27px; text-align: center;">
				<i class="fa fa-plus-circle" style="font-size: 30px; color: #0095d8; cursor: pointer;"></i><br>
				<p style="margin-top: 27px; color: #587ca0;">Add something from Library</p>
			</div>
		</div>
		<div id="spinner-pl" class="csspinner duo hide"></div>
	</div>
</div>

<div id="bio" class="hide">
	<div class="container">
		<h1>BIO</h1><a id="closebio"><i class="fa fa-times fa-2x"></i></a>
		<div id="biocontent">
			<div class="biosimilar"></div>
		</div>
	</div>
</div>
<?php
// context menus
function menuli( $command, $icon, $label, $type ) {
	$type = $type ? ' data-type="'.$type.'"' : '';
	return '<a data-cmd="'.$command.'"'.$type.'><i class="fa fa-'.$icon.'"></i>'.$label.'</a>';
}
function menudiv( $id, $html ) {
	$id = $id ? '-'.$id : '';
	return '
		<div id="context-menu'.$id.'" class="menu contextmenu hide">'.$html.'</div>';
}
function menucommon( $add, $addplay, $replaceplay ) {
	$htmlcommon = '<a class="menushadow"></a>';
	$htmlcommon.= menuli( $add,         'plus-o',            'Add' );
	$htmlcommon.= menuli( $addplay,     'play-plus-o',       'Add and play' );
	$htmlcommon.= menuli( $replaceplay, 'play-plus-refresh', 'Replace and play' );
	return $htmlcommon;
}
function menucommonsp( $type ) {
	$htmlcommon = '<a class="menushadow"></a>';
	$htmlcommon.= menuli( 'spadd',            'plus-o',            'Add',              $type );
	$htmlcommon.= menuli( 'spaddplay',        'play-plus-o',       'Add and play',     $type );
	$htmlcommon.= menuli( 'spaddreplaceplay', 'play-plus-refresh', 'Replace and play', $type );
	return $htmlcommon;
}
$menu = '<div>';
$htmlcommon = menucommon( 'add', 'addplay', 'addreplaceplay' );

$html = $htmlcommon;
$html.= menuli( 'rescan',      'folder-refresh', 'Update this folder' );
$html.= menuli( 'bookmarkadd', 'star',           'Save as bookmark' );
$menu.= menudiv( '', $html );
$menudiv = '';

$html = $htmlcommon;
$html.= menuli( 'lastfmaddreplaceplay', 'lastfm', 'Last.fm playlist' );
$menu.= menudiv( 'file', $html );
$menudiv = '';

$html = menucommon( 'wradd', 'wraddplay', 'wraddreplaceplay' );
$html.= menuli( 'wrsave', 'save', 'Save in Webradios' );
$menu.= menudiv( 'dirble', $html );
$menudiv = '';

$html = menucommonsp( 'spotify-playlist' );
$menu.= menudiv( 'spotify-pl', $html );
$menudiv = '';

$html = menucommonsp( 'spotify-track' );
$menu.= menudiv( 'spotify', $html );
$menudiv = '';

$html = menucommon( 'wradd', 'wraddplay', 'wraddreplaceplay' );
$html.= menuli( 'wrrename', 'edit-circle',  'Rename' );
$html.= menuli( 'wrdelete', 'minus-circle', 'Delete' );
$menu.= menudiv( 'webradio', $html );
$menudiv = '';

$html = '<a class="menushadow"></a>';
$html.= menuli( 'pladd',            'plus-o',            'Add' );
$html.= menuli( 'plreplace',        'plus-refresh',      'Replace' );
$html.= menuli( 'pladdreplaceplay', 'play-plus-refresh', 'Replace and play' );
$html.= menuli( 'plashuffle',       'random',            'Add randomly' );
$html.= menuli( 'plrename',         'edit-circle',       'Rename' );
$html.= menuli( 'pldelete',         'minus-circle',      'Delete' );
$menu.= menudiv( 'playlist', $html );
$menudiv = '';

$html = menucommon( 'albumadd', 'albumaddplay', 'albumaddreplaceplay' );
$menu.= menudiv( 'album', $html );
$menudiv = '';

$html = menucommon( 'artistadd', 'artistaddplay', 'artistaddreplaceplay' );
$menu.= menudiv( 'artist', $html );
$menudiv = '';

$html = menucommon( 'genreadd', 'genreaddplay', 'genreaddreplaceplay' );
$menu.= menudiv( 'genre', $html );
$menudiv = '';

$html = menucommon( 'composeradd', 'composeraddplay', 'composeraddreplaceplay' );
$menu.= menudiv( 'composer', $html );
$menu.= '</div>';

echo $menu;
?>
<div id="overlay-social" class="overlay-scale closed">
    <nav>
        <ul>
            <li><span>Share this track</span></li>
            <li><a id="urlTwitter" onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;" class="btn btn-default btn-lg btn-block share-twitter" href="#"><i class="fa fa-twitter sx"></i> Share on Twitter</a></li>
            <li><a id="urlFacebook" onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;" class="btn btn-default btn-lg btn-block share-facebook" href="#"><i class="fa fa-facebook sx"></i> Share on Facebook</a></li>
            <li><a id="urlGooglePlus" onclick="javascript:window.open(this.href, '', 'menubar=no,toolbar=no,resizable=yes,scrollbars=yes,height=600,width=600');return false;" class="btn btn-default btn-lg btn-block share-google-plus" href="#"><i class="fa fa-google-plus sx"></i> Share on Google+</a></li>
            <li><a id="support-us" class="btn btn-default btn-lg btn-block" href="http://www.runeaudio.com/support-us/" target="_blank"><i class="fa fa-heart sx"></i> Support RuneAudio</a></li>
            <li><button id="overlay-social-close" class="btn btn-link" type="button"><i class="fa fa-times"></i> close this layer</button></li>
        </ul>
    </nav>
</div>
<div id="overlay-playsource" class="overlay-scale closed">
    <nav>
        <ul>
            <li><span>Playback source</span></li>
			<li><a href="javascript:;" id="playsource-mpd" class="btn btn-default btn-lg btn-block" title="Switch to MPD"><i class="fa fa-linux sx"></i> MPD</a></li>
			<li><a href="javascript:;" id="playsource-spotify" class="btn btn-default btn-lg btn-block inactive" title="Switch to Spotify"><i class="fa fa-spotify sx"></i> <span>spop</span> Spotify</a></li>
			<li><a href="javascript:;" id="playsource-airplay" class="btn btn-default btn-lg btn-block inactive"><i class="fa fa-airplay sx"></i> <span>ShairPort</span> Airplay</a></li>
			<li><a href="javascript:;" id="playsource-dlna" class="btn btn-default btn-lg btn-block inactive"><i class="fa fa-dlna sx"></i> <span>upmpdcli</span> DLNA</a></li>
            <li><button id="overlay-playsource-close" class="btn btn-link" type="button"><i class="fa fa-times"></i> close this layer</button></li>
        </ul>
    </nav>
</div>
