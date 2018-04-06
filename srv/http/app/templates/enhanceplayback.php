<div class="tab-content" id="content">
	<!-- PLAYBACK PANEL -->
	<div id="playback" class="tab-pane active">
		<div id="barleft"></div>
		<div id="barright"></div>
		
		<div id="container-playback">
			<div id="info">
				<div id="divartist">
					<span id="currentartist"></span>
				</div>
				<div id="divsong">
					<span id="currentsong"></span>
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
					<span id="elapsed"></span>
					<span id="total"></span>
				</div>
				<div id="play-group">
					<div class="btn-group">
						<button id="repeat" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button" title="Repeat" data-cmd="repeat"><i class="fa fa-repeat"></i></button>
						<button id="random" class="btn btn-default btn-lg btn-cmd btn-toggle" type="button" title="Random" data-cmd="random"><i class="fa fa-random"></i></button>
						<button id="single" class="btn btn-default btn-lg btn-cmd btn-toggle <?php if ($this->activePlayer === 'Spotify'): ?>disabled<?php endif; ?>" type="button" title="Single" data-cmd="single"><i class="fa fa-dot-circle-o"></i></button>
					</div>
				</div>
				<div id="coverart">
					<img id="cover-art" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="transparent-square">
					<div id="coverT" class="covermap t0 w130 h50 m-65"></div>
					<div id="coverB" class="covermap t180 w130 h50 m-65"></div>
					<div id="coverM" class="covermap t50 w130 h130 m-65"></div>
					<div id="coverL" class="covermap t50 w50 h130 m-115"></div>
					<div id="coverR" class="covermap t50 w50 h130 m65"></div>
				</div>
				<div id="share-group">
					<div class="btn-group">
						<button id="overlay-social-open" class="btn btn-default btn-lg" type="button" title="Share this track"><i class="fa fa-share-alt"></i></button>
						<button id="songinfo-open" class="btn btn-default" type="button" title="Song Info" data-toggle="modal"><i class="fa fa-info"></i></button>
					</div>
				</div>
				<div id="volume-knob" class="<?=$this->volume['divclass'] ?>">
					<div id="volume" data-dynamic="<?=$this->volume['dynamic'] ?>"></div>
					<div id="voluprs"></div>
					<div id="voldnrs"></div>
				</div>
				<div id="vol-group">
					<div class="btn-group">
						<button id="voldn" class="btn btn-default btn-lg" type="button" title="Volume down"><i class="fa fa-volume-down"></i></button>
						<button id="volmute" class="btn btn-default btn-lg" type="button" title="Volume mute/unmute"><i class="fa fa-volume-off"></i> <i class="fa fa-exclamation"></i></button>
						<button id="volup" class="btn btn-default btn-lg" type="button" title="Volume up"><i class="fa fa-volume-up"></i></button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<!-- LIBRARY PANEL -->
	<div id="panel-sx" class="tab-pane">
		<div class="btnlist btnlist-top">
			<form id="db-search" class="form-inline" action="javascript:if (document.getElementById( 'db-search-keyword' ).value) getDB({cmd: 'search', path: GUI.currentpath, browsemode: GUI.browsemode});">
				<div class="input-group">
					<input id="db-search-keyword" class="form-control osk-trigger" type="text" value="" placeholder="search in DB...">
					<span class="input-group-btn">
						<button class="btn btn-default" type="submit" title="Search"><i class="fa fa-search"></i></button>
					</span>
				</div>
			</form>
			<div id="db-currentpath" class="hide">
				<i id="db-home" class="fa fa-folder-open"></i> <span></span>
			</div>
			<button id="db-search-results" class="btn hide" type="button" title="Close search results and go back to the Library browsing"><i class="fa fa-times sx"></i></button>
			<i id="db-level-up" class="fa fa-arrow-left"></i>
			<i id="db-webradio-add" class="fa fa-plus-circle hide"></i>
		</div>
		<div id="database">
			<ul id="database-entries" class="database">
				<!-- DB entries -->
			</ul>
			<ul id="db-index" class="hide">
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
			<div id="home-blocks" class="row">
				<div class="col-sm-12">
					<h1 class="txtmid">Browse your library</h1>
				</div>
			</div>
		</div>
		<button id="db-homeSetup" class="btn btn-default hide" type="button" title="Setup the Library home screen"><i class="fa fa-gear"></i></button>
		<div id="spinner-db" class="csspinner duo hide"></div>
	</div>
	<!-- QUEUE PANEL -->
	<div id="panel-dx" class="tab-pane">
		<div class="btnlist btnlist-top">
			<button id="pl-filter-results" class="btn hide" type="button" title="Close filter results and go back to the playing Queue"><i class="fa fa-times sx"></i></button>
			<div id="pl-manage">
				<i id="pl-manage-list" class="fa fa-file-text-o fa-lg" title="Manage playlists"></i>
				<i id="pl-manage-save" class="fa fa-save fa-lg" title="Save current queue as playlist" data-toggle="modal" data-target="#modal-pl-save"></i>
				<!--<i id="pl-import-youtube" class="fa fa-youtube-play" title="Import a playlist or video from youtube." data-toggle="modal" data-target="#modal-pl-youtube"></i>-->
				<i id="pl-manage-clear" class="fa fa-trash-o fa-lg" title="Clear the playing queue" data-toggle="modal" data-target="#modal-pl-clear"></i>
			</div>
			<span id="pl-count" class="hide">2143 entries</span>
			<form id="pl-search" class="form-inline" method="post" onSubmit="return false;" role="form">
				<div class="input-group">
					<input id="pl-filter" class="form-control osk-trigger ttip" type="text" value="" placeholder="search in queue..." data-placement="bottom" data-toggle="tooltip" data-original-title="Type here to search on the fly">
					<span class="input-group-btn">
						<button class="btn btn-default" type="button" title="Search"><i class="fa fa-search"></i></button>
					</span>
				</div>
			</form>
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
			<div id="playlist-warning" class="playlist hide">
				<div class="col-sm-12">
					<h1 class="txtmid">Playing queue</h1>
				</div>
				<div class="col-sm-6 col-sm-offset-3">
					<div class="empty-block">
						<i class="fa fa-exclamation"></i>
						<h3>Empty queue</h3>
						<p>Add some entries from your library</p>
						<p><a id="open-library" href="#panel-sx" class="btn btn-primary btn-lg" data-toggle="tab">Browse Library</a></p>
					</div>
				</div>
			</div>
		</div>
		<div id="spinner-pl" class="csspinner duo hide"></div>
	</div>
</div>

<div id="bio" style="display: none;">
	<div class="container">
		<h1>BIO</h1><a id="closebio"><i class="fa fa-times fa-2x"></i></a>
		<div id="biocontent">
			<div class="biosimilar"></div>
		</div>
	</div>
</div>
