#!/bin/bash

# $1-zoom
# $2-local browser

# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

installstart $@

#0temp0 remove uninstall leftover
sed -i 's|fa-music sx"></i> Library\(.\);|fa-folder-open"></i>\1|' /srv/http/assets/js/runeui.js
sed -i 's/gifico|svg/gif|ico/' /etc/nginx/nginx.conf
rm -f /srv/http/assets/js/vendor/{hammer.min.js,propagating.js}
sed -i '/hammer.min.js\|propagating.js/ d' /srv/http/app/templates/footer.php
#1temp1

mv /srv/http/app/coverart_ctl.php{,.backup}
mv /srv/http/app/playback.php{,.backup}
mv /srv/http/assets/js/runeui.js{,.backup}
mv /srv/http/assets/js/runeui.min.js{,.backup}
mv /srv/http/command/airplay_toggle{,.backup}
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
        <ul id="settings" class="dropdown-menu hide" role="menu" aria-labelledby="menu-settings">
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
<div id="menu-top" class="hide">
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

commentH 'id="clock-display"' -n +2 'id="open-panel-dx"'

string=$( cat <<'EOF'
    <a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank" alt="RuneAudio Forum">
        <img class="logo" src="<?=$this->asset('/img/runelogo.svg')?>">
    </a>
</div>
<div id="menu-bottom" class="hide">
    <ul>
        <li id="open-panel-sx"><a><i class="fa fa-folder-open"></i></a></li>
        <li id="open-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>
        <li id="open-panel-dx"><a><i class="fa fa-list-ul"></i></a></li>
    </ul>
</div>
EOF
)
insertH 'id="clock-display"'
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

commentH 'knob.min.js' 'bootstrap-contextmenu.min.js'
commentH 'modernizr'

# 0.4b
if grep -q 'jquery-ui.js' $file; then
    commentH 'jquery-ui.js'
	string=$( cat <<'EOF'
    <script src="<?=$this->asset('/js/vendor/jquery-ui.min.js')?>"></script>
EOF
)
appendH 'jquery.onScreenKeyboard.js'
fi

string=$( cat <<'EOF'
<script src="<?=$this->asset('/js/vendor/modernizr-custom.js')?>"></script>
<script src="<?=$this->asset('/js/vendor/roundslider.min.js')?>"></script>
<script src="<?=$this->asset('/js/enhance.js')?>"></script>
EOF
)
appendH -n +1 'addonsmenu.js'
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
if [[ $1 != u ]]; then # keep range: 0.5 - 3.0
	z=$1;
	zoom=$( echo "0.5 $z 3" \
      | awk '{
          if (( $1 < $2 && $2 < $3 ))
            print $2
          else if (( $2 < $1 ))
            print $1
          else
            print $3
        }'
	)
	redis-cli set zoomlevel $zoom &> /dev/null
else
	zoom=$( redis-cli get zoomlevel )
fi

#----------------------------------------------------------------------------------
file=/root/.config/midori/config
if ! grep '^chromium' $file &> /dev/null; then
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
	
	sed -i "s/\(force-device-scale-factor=\).*/\1$zoom/" $file
fi
#----------------------------------------------------------------------------------
file=/boot/config.txt
echo $file
echo 'disable_overscan=1
hdmi_ignore_cec=1' >> $file
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/enhanceplayback.php  # for rune youtube
[[ -e /usr/local/bin/uninstall_RuneYoutube.sh ]] && sed -i '/id="pl-import-youtube"/ {s/<!--//; s/-->//}' $file
#----------------------------------------------------------------------------------

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

# set library home database
if [[ $1 != u ]]; then
	redis-cli hmset display bars checked pause checked time checked coverart checked volume checked buttons checked \
	\nas checked sd checked usb checked webradio checked albums checked artists checked composer checked genre checked \
	\spotify checked dirble checked jamendo checked &> /dev/null
fi
# disable screensaver
redis-cli set localSStime -1 &> /dev/null

installfinish $@

if [[ $2 == 0 ]]; then
	killall Xorg
	redis-cli set local_browser 0
else
	clearcache
fi

title -nt "$info Please" $( tcolor 'clear browser cache' ).
[[ $1 != u ]] && title -nt "First time install:"  $( tcolor 'reboot as well' ).

[[ $svg == 0 ]] && restartnginx
