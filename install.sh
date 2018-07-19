#!/bin/bash

# $1-zoom
# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

installstart $@

#0temp0 remove uninstall leftover
sed -i 's|fa-music sx"></i> Library\(.\);|fa-folder-open"></i>\1|' /srv/http/assets/js/runeui.js
sed -i 's/gifico|svg/gif|ico/' /etc/nginx/nginx.conf
#1temp1

mv /srv/http/app/coverart_ctl.php{,.backup}
mv /srv/http/assets/js/runeui.min.js{,.backup}
mv /usr/share/bootsplash/start-runeaudio.png{,.backup}
mv /usr/share/bootsplash/reboot-runeaudio.png{,.backup}
mv /usr/share/bootsplash/shutdown-runeaudio.png{,.backup}

getinstallzip

ln -s /usr/share/bootsplash/{start,reboot}-runeaudio.png
ln -s /usr/share/bootsplash/{start,shutdown}-runeaudio.png

echo -e "$bar Modify files ..."
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/header.php
echo $file

commentH 'RuneAudio - RuneUI'

string=$( cat <<'EOF'
    <title>RuneUIe</title>
EOF
)
appendH 'RuneAudio - RuneUI'

string=$( cat <<'EOF'
    <link rel="stylesheet" href="<?=$this->asset('/css/roundslider.min.css')?>">
    <link rel="stylesheet" href="<?=$this->asset('/css/enhance.css')?>">
EOF
)
appendH 'runeui.css'

commentH 'id="menu-top"' 'href="/"><i class="fa fa-play">'

string=$( cat <<'EOF'
<div id="bartop"></div>
<div id="barbottom"></div>
        <ul id="settings" class="dropdown-menu" role="menu" aria-labelledby="menu-settings">
            <li id="dropdownbg"></li>

EOF
)
appendH 'href="/"><i class="fa fa-play">'

commentH 'href="#poweroff-modal"'

string=$( cat <<'EOF'
            <li class="<?=$this->uri(1, 'dev', 'active')?>"><a href="/dev/"><i class="fa fa-gears"></i> Development</a></li>
            <li><a id="turnoff"><i class="fa fa-power-off"></i> Power</a></li>
EOF
)
insertH 'href="#poweroff-modal"'

string=$( cat <<'EOF'
        </ul>
<div id="menu-top">
    <i id="menu-settings" class="fa fa-gear"></i>
EOF
)
insertH -n -2 'class="playback-controls"'

commentH -n -2 'class="playback-controls"' -n -1 'class="playback-controls"'

string=$( cat <<'EOF'
        <button id="pause" class="btn btn-default btn-cmd" title="Pause" data-cmd="play"><i class="fa fa-pause"></i></button>
EOF
)
appendH 'id="play"'

commentH 'class="home"'

string=$( cat <<'EOF'
    <a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank" alt="RuneAudio Forum">
        <img class="logo" src="<?=$this->asset('/img/runelogo.svg')?>">
    </a>
EOF
)
insertH 'class="home"'

commentH 'id="open-panel-sx"' 'id="open-panel-dx"'

string=$( cat <<'EOF'
        <li id="open-panel-sx"><a><i class="fa fa-folder-open"></i></a></li>
        <li id="open-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>
        <li id="open-panel-dx"><a><i class="fa fa-list-ul"></i></a></li>
EOF
)
appendH 'id="open-panel-dx"'
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/footer.php
echo $file

commentH 'id="poweroff-modal"' 'id="loader"'

string=$( cat <<'EOF'
<div id="loader"<?php if ($this->section == 'dev') { ?> class="hide"<?php } ?>>
	<div id="loaderbg"></div><div id="loadercontent"><img src="<?=$this->asset('/img/runelogo.svg')?>"></div>
</div>
EOF
)
appendH 'id="loader"'

commentH 'knob.min.js'
commentH 'countdown.min.js'
commentH 'modernizr'

# 0.4b
if grep -q 'jquery-ui.js' $file; then
    commentH 'jquery-ui.js'
	
    string=$( cat <<'EOF'
<script src="<?=$this->asset('/js/vendor/jquery-ui.min.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/modernizr-custom.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/roundslider.min.js')?>"></script>
<script src="<?=$this->asset('/js/enhance.js')?>"></script>
EOF
)
else
    string=$( cat <<'EOF'
<script src="<?=$this->asset('/js/vendor/modernizr-custom.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/roundslider.min.js')?>"></script>
<script src="<?=$this->asset('/js/enhance.js')?>"></script>
EOF
)
fi
appendH '$'
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/playback.php
echo $file

release=$( redis-cli get release )
if [[ $release == 0.4b ]]; then
    string=$( cat <<'EOF'
if ( $this->remoteSStime != -1 ) {
EOF
)
    insertP '<div class="screen-saver-content"'

    string=$( cat <<'EOF'
}
EOF
)
    insertP '<div class="tab-content">'
fi

commentH '<div class="tab-content">' -n -1 '<div id="context-menus">'

string=$( cat <<'EOF'
include "enhanceplayback.php";
EOF
)
insertP '<div id="context-menus">'
#----------------------------------------------------------------------------------
file=/srv/http/assets/js/runeui.js
echo $file

comment 'function renderLibraryHome()' -n -3 'function getPlaylist(text)'
comment 'function renderUI(text)' -n -3 'function renderPlaylists(data)'
comment -n +2 '(evtname, visChange)' -n -1 '// PLAYING QUEUE'
#----------------------------------------------------------------------------------
file=/srv/http/db/index.php
echo $file
comment 'echo getPlayQueue($mpd)'

string=$( cat <<'EOF'
                $playlist = getPlayQueue( $mpd );
                if ( preg_match( '/file: http/', $playlist ) ) {
                    $redis = new Redis();
                    $redis->pconnect( '127.0.0.1' );
                }
                $line = strtok( $playlist."\nfile", "\n" );
                while ( $line !== false ) {
                    if ( strpos( $line, 'file' ) === 0 && $data ) {
                        $file = $data[ 'file' ];
                        if ( substr( $file, 0, 4 ) === 'http' ) {
                            $webradios = $redis->hGetAll( 'webradios' );
                            $webradioname = array_flip( $webradios );
                            $data[ 'Title' ] = $webradioname[ $file ];
                        }
                        $pathinfo = pathinfo( $file );
                        if ( !isset( $data[ 'Artist' ] ) ) $data[ 'Artist' ] = basename( $pathinfo[ 'dirname' ] );
                        if ( !isset( $data[ 'Title' ] ) ) $data[ 'Title' ] = $pathinfo[ 'filename' ];
                        if ( !isset( $data[ 'Album' ] ) ) $data[ 'Album' ] = '';
                        $info[] = $data;
                        $data = NULL;
                    }
                    $kv = explode( ': ', $line, 2 );
                    if ( $kv[ 0 ] !== 'OK' && $kv[ 0 ] ) $data[ $kv[ 0 ] ] = $kv[ 1 ];
                    $line = strtok( "\n" );
                }
                echo json_encode( $info );
EOF
)
append 'echo getPlayQueue($mpd)'
#----------------------------------------------------------------------------------
file=/srv/http/app/libs/runeaudio.php
echo $file

string=$( cat <<'EOF'
        if ( preg_match( '/playlist: Webradio/', $plistLine ) ) {
            $redis = new Redis();
            $redis->pconnect( '127.0.0.1' );
        }
EOF
)
append 'browseMode = TRUE'
comment 'parseFileStr($value'
string=$( cat <<'EOF'
                $pathinfo = pathinfo( $value );
                $plistArray[ $plCounter ][ 'fileext' ] = $pathinfo[ 'extension' ];
                if ( preg_match( '/^Webradio/', $value ) ) {
                    $webradiourl = $redis->hGet( 'webradios', $pathinfo[ 'filename' ] );
                    $plistArray[ $plCounter ][ 'url' ] = $webradiourl;
                }
EOF
)
append 'parseFileStr($value'
string=$( cat <<'EOF'
            $redis->hDel('sampling', $label);
EOF
)
append 'hDel(.webradios., $label)'
#----------------------------------------------------------------------------------
file=/srv/http/app/settings_ctl.php
echo $file

string=$( cat <<'EOF'
if ( $template->local_browser ) {
    exec( '/usr/bin/sudo /usr/bin/xinit &> /dev/null &' );
} else {
    exec( '/usr/bin/sudo /usr/bin/killall Xorg' );
}
EOF
)
append '$'
#----------------------------------------------------------------------------------
file=/srv/http/command/airplay_toggle
echo $file

string=$( cat <<'EOF'
		exec( '/usr/bin/systemctl stop mpd' );
		ui_render('playback', '{"actPlayer":"Airplay"}');
EOF
)
append 'Playback has been switched'

string=$( cat <<'EOF'
		exec( '/usr/bin/systemctl start mpd' );
		ui_render('playback', '{"actPlayer":"MPD"}');
EOF
)
append 'Airplay playback has completed'
#----------------------------------------------------------------------------------
file=/srv/http/command/rune_PL_wrk
echo $file

string=$( cat <<'EOF'
                        $status['activePlayer'] = "Airplay";
EOF
)
append 'song_percent'
#----------------------------------------------------------------------------------
file=/etc/nginx/nginx.conf
if ! grep -q 'ico|svg' $file; then
	echo $file
	commentS 'gif\|ico'
	string=$( cat <<'EOF'
        location ~* (.+)\.(?:\d+)\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
EOF
)
	appendS 'gif\|ico'
	
	svg=0
else
	svg=1
fi
#----------------------------------------------------------------------------------
if [[ $1 != u ]]; then
	zoom=$1;
	zoom=$( echo $zoom | awk '{if ($1 < 0.5) print 0.5; else print $1}' )
	zoom=$( echo $zoom | awk '{if ($1 > 3) print 3; else print $1}' )
else
	zoom=$( redis-cli get enhazoom )
	redis-cli del enhazoom &> /dev/null
fi

if ! pacman -Q chromium &> /dev/null; then
#----------------------------------------------------------------------------------
	file=/root/.config/midori/config
	echo $file
	
	commentS 'zoom-level'
	commentS 'user-stylesheet-uri'
	
	string=$( cat <<EOF
zoom-level=$zoom
EOF
)
	appendS 'settings'
else
#----------------------------------------------------------------------------------
	file=/root/.xinitrc
	echo $file
	
	commentS 'force-device-scale-factor='
	string=$( cat <<EOF
force-device-scale-factor=$zoom
EOF
)
	appendS 'force-device-scale-factor='
fi
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/enhanceplayback.php  # for rune youtube
[[ -e /usr/local/bin/uninstall_RuneYoutube.sh ]] && sed -i '/id="pl-import-youtube"/ {s/<!--//; s/-->//}' $file
#----------------------------------------------------------------------------------

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

# set library home database
if [[ $1 != u ]]; then
	redis-cli hmset display bar checked pause checked time checked coverart checked volume checked buttons checked \
	\nas checked sd checked usb checked webradio checked albums checked artists checked composer checked genre checked \
	\spotify checked dirble checked jamendo checked &> /dev/null
fi
# disable screensaver
redis-cli set localSStime -1 &> /dev/null

installfinish $@

clearcache
echo -e "$info Please clear browser cache."
title -nt "If first time install, reboot as well."

[[ $svg == 0 ]] && restartnginx
