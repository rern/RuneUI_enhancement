<div class="tab-content" id="content">
    <!-- PLAYBACK PANEL -->
    <div id="playback" class="tab-pane active">
        <div id="barleft"></div>
        <div id="barright"></div>
		
		<div id="container-playback">
            <div id="info">
                <div id="divartist">
                    <span id="currentartist"><i class="fa fa-spinner fa-spin"></i></span>
                </div>
                <div id="divsong">
                    <span id="currentsong"><i class="fa fa-spinner fa-spin"></i></span>
                </div>
                <div id="divalbum">
                    <span id="currentalbum"><i class="fa fa-spinner fa-spin"></i></span>
                </div>
                <div id="sampling">
                    <span id="playlist-position"><span></span></span>
                    <span id="format-bitrate"><i class="fa fa-spinner fa-spin"></i></span>
                </div>
            </div>
            <div class="row hide" id="playback-row">
                <div id="time-knob">
                    <input id="time" value="0" data-width="230" data-height="230" data-bgColor="#34495E" data-fgcolor="#0095D8" data-thickness="0.30" data-min="0" data-max="1000" data-displayInput="false" data-displayPrevious="true">
                    <div id="overlay-playsource-open" title="View and change playback source">
                        <button class="btn btn-default btn-xs">MPD</button>
                    </div>
                    <span id="countdown-display"><i class="fa fa-spinner fa-spin"></i></span>
                    <span id="total"><i class="fa fa-spinner fa-spin"></i></span>
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
                </div>
                <div id="share-group">
                    <div class="btn-group">
                        <button id="overlay-social-open" class="btn btn-default btn-lg" type="button" title="Share this track"><i class="fa fa-share-alt"></i></button>
                        <button id="songinfo-open" class="btn btn-default" type="button" title="Song Info" href="#songinfo-modal" data-toggle="modal"><i class="fa fa-info"></i></button>
                    </div>
                </div>
                <div id="volume-knob" class="<?=$this->volume['divclass'] ?>">
                    <?php // fix smaller volume knob size in mobile
                    $wh = stristr($_SERVER['HTTP_USER_AGENT'], 'mobi') !== FALSE ? 250 : 230;
                    ?>
                    <input id="volume" value="100" data-width=<?=$wh ?> data-height=<?=$wh ?> data-bgColor="#f00" data-thickness="0.25" data-skin="tron" data-cursor="true" data-angleArc="250" data-angleOffset="-125" data-readOnly="<?=$this->volume['readonly'] ?>" data-fgColor="<?=$this->volume['color'] ?>">
                </div>
                <div id="vol-group">
                    <div class="btn-group">
                        <button id="volumedn" class="btn btn-default btn-lg btn-cmd btn-volume" type="button" title="Volume down" data-cmd="volumedn"><i class="fa fa-volume-down"></i></button>
                        <button id="volumemute" class="btn btn-default btn-lg btn-cmd btn-volume" type="button" title="Volume mute/unmute" data-cmd="volumemute"><i class="fa fa-volume-off"></i> <i class="fa fa-exclamation"></i></button>
                        <button id="volumeup" class="btn btn-default btn-lg btn-cmd btn-volume" type="button" title="Volume up" data-cmd="volumeup"><i class="fa fa-volume-up"></i></button>
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
				<li>#</li>
				<li>A</li>
				<li class="half">B</li>
				<li>C</li>
				<li class="half">D</li>
				<li>E</li>
				<li class="half">F</li>
				<li>G</li>
				<li class="half">H</li>
				<li>I</li>
				<li class="half">J</li>
				<li>K</li>
				<li class="half">L</li>
				<li>M</li>
				<li class="half">N</li>
				<li>O</li>
				<li class="half">P</li>
				<li>Q</li>
				<li class="half">R</li>
				<li>S</li>
				<li class="half">T</li>
				<li>U</li>
				<li class="half">V</li>
				<li>W</li>
				<li class="half">X</li>
				<li>Y</li>
				<li class="half">Z</li>
				<li>&nbsp</li>
				<li>&nbsp</li>
				<li>&nbsp</li>
				<li>&nbsp</li>
				<li>&nbsp</li>
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
