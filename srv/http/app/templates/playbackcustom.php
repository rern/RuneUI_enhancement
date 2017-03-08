<div class="tab-content" id="content">
    <!-- PLAYBACK PANEL -->
    <div id="playback" class="tab-pane active">
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
            <div class="row" id="playback-row">
                <div id="time-knob">
                    <input id="time" value="0" data-width="230" data-height="230" data-bgColor="#34495E" data-fgcolor="#0095D8" data-thickness="0.30" data-min="0" data-max="1000" data-displayInput="false" data-displayPrevious="true">
                    <div id="overlay-playsource-open" title="View and change playback source">
                        <button class="btn btn-default btn-xs<?php if ($this->spotify === '0') echo " disabled"?>" style="margin-top: -330px;">MPD</button>
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
                <?php if ($this->coverart == 1): ?>
                <div id="coverart">
                    <img id="cover-art" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="transparent-square">
                </div>
                <div id="share-group">
                    <div class="btn-group">
                        <button id="overlay-social-open" class="btn btn-default btn-lg" type="button" title="Share this track"><i class="fa fa-share-alt"></i></button>
                    </div>
                </div>
                <?php endif ?>
                <?php if (!preg_match('/mixer_type[\s]+"disabled"/', file_get_contents('/etc/mpd.conf'))):?>
                <div id="volume-knob" class="<?=$this->volume['divclass'] ?>">
                    <?php // fix smaller volume knob size in mobile
                    $mobile = stristr($_SERVER['HTTP_USER_AGENT'], 'mobi') !== FALSE;
                    $wh = $mobile ? 250 : 230;
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
                <?php endif ?>
            </div>
        </div>
    </div>