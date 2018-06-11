#!/bin/bash

# $1-zoom
# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

installstart $@

# temp fix: remove uninstall leftover
sed -i 's|fa-music sx"></i> Library\(.\);|fa-folder-open"></i>\1|' /srv/http/assets/js/runeui.js

mv /srv/http/app/coverart_ctl.php{,.backup}
mv /srv/http/assets/js/runeui.min.js{,.backup}

getinstallzip

# modify files #######################################
echo -e "$bar Modify files ..."

file=/srv/http/app/templates/header.php
echo $file
commentphp 'RuneAudio - RuneUI'
string=$( cat <<'EOF'
    <title>RuneUIe</title>
EOF
)
appendphp 'RuneAudio - RuneUI'
string=$( cat <<'EOF'
    <link rel="stylesheet" href="<?=$this->asset('/css/roundslider.min.css')?>">\n\
    <link rel="stylesheet" href="<?=$this->asset('/css/enhance.css')?>">
EOF
)
appendphp 'runeui.css'
string=$( cat <<'EOF'
<div id="bartop"></div>\n\
<div id="barbottom"></div>
EOF
)
insertphp 'id="menu-top"'
commentphp 'href="#">MENU'
string=$( cat <<'EOF'
        <button id="menu-settings" class="dropdown-toggle btn-default" role="button" data-toggle="dropdown" data-target="#" href="#"><i class="fa fa-gear"></i></button>
EOF
)
appendphp 'href="#">MENU'
commentphp 'href="."><i class="fa fa-play"'
string=$( cat <<'EOF'
            <li id="dropdownbg"></li>
EOF
)
appendphp 'href="."><i class="fa fa-play"'
string=$( cat <<'EOF'
            <li class="<?=$this->uri(1, 'dev', 'active')?>"><a href="/dev/"><i class="fa fa-code"></i> Development</a></li>
EOF
)
appendphp 'Credits'
string=$( cat <<'EOF'
        <button id="pause" class="btn btn-default btn-cmd" title="Pause" data-cmd="play"><i class="fa fa-pause"></i></button>
EOF
)
appendphp 'id="play"'
commentphp 'class="home"'
string=$( cat <<'EOF'
    <a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank" alt="RuneAudio Forum">\n\
        <img class="logo" src="<?=$this->asset('/img/runelogo.svg')?>">\n\
    </a>
EOF
)
insertphp 'class="home"'
commentphp 'id="open-panel-sx"' 'id="open-panel-dx"'

string=$( cat <<'EOF'
        <li id="open-panel-sx"><a><i class="fa fa-folder-open"></i></a></li>\n\
        <li id="open-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>\n\
        <li id="open-panel-dx"><a><i class="fa fa-list-ul"></i></a></li>
EOF
)
appendphp 'id="open-panel-dx"'

file=/srv/http/app/templates/footer.php
echo $file
sed -i '/knob.min.js\|countdown.min.js\|jquery-ui.js/ {s/^/<!--enha/; s/$/enha-->/}' $file
# must be before lyrics addon
if ! grep -q 'lyrics.js' $file; then
	sed -i $'$ a\
<script src="<?=$this->asset(\'/js/vendor/roundslider.min.js\')?>"></script>\
<script src="<?=$this->asset(\'/js/enhance.js\')?>"></script>
	' $file
else
	sed -i $'/lyrics.js/ i\
<script src="<?=$this->asset(\'/js/vendor/roundslider.min.js\')?>"></script>\
<script src="<?=$this->asset(\'/js/enhance.js\')?>"></script>
' $file
fi
! grep -q 'hammer.min.js' $file && sed -i $'$ a\<script src="<?=$this->asset(\'/js/vendor/hammer.min.js\')?>"></script>' $file
! grep -q 'propagating.js' $file && sed -i $'$ a\<script src="<?=$this->asset(\'/js/vendor/propagating.js\')?>"></script>' $file
# 0.4b
if grep -q 'jquery-ui.js' $file; then
	sed -i $'/jquery-ui.js/ a\<script src="<?=$this->asset(\'/js/vendor/jquery-ui.min.js\')?>"></script>' $file
fi

file=/srv/http/app/templates/playback.php
echo $file
release=$( redis-cli get release )
if [[ $release == 0.4b ]]; then
sed -i -e '/<div class="screen-saver-content"/ i\
<?php if ( $this->remoteSStime != -1 ) { //enha ?>
' -e '/<div class="tab-content">/ i\
<?php }//enha ?>
' $file
fi
sed -i -e '/<div class="tab-content">/ i\
<?php include "enhanceplayback.php"; //enha ?>\
<?php if(0){//enha ?>
' -e '/id="context-menus"/ i\
<?php }//enha ?>
' -e 's|</input>||; s|</img>||
' $file

file=/srv/http/assets/js/runeui.js
echo $file
sed -i -e '\|// KNOBS| i\
/*enha
' -e '\|// PLAYING QUEUE| i\
enha*/
' -e '/\.countdown(/ s|^|//|
' -e 's|\(fa-spin"></i>\) Updating|\1|
' -e 's|fa-music sx"></i> Library|fa-folder-open"></i>|
' $file

file=/srv/http/db/index.php
echo $file
sed -i '/echo getPlayQueue($mpd)/ {
s|^|//|;
a\
                $playlist = getPlayQueue( $mpd ); //enha0\
                if ( preg_match( "/file: http/", $playlist ) ) {\
                    $redis = new Redis();\
                    $redis->pconnect( "127.0.0.1" );\
                }\
                $line = strtok( $playlist."\\nfile", "\\n" );\
                while ( $line !== false ) {\
                    if ( strpos( $line, "file" ) === 0 && $data ) {\
                        $file = $data[ "file" ];\
                        if ( substr( $file, 0, 4 ) === "http" ) {\
                            $webradios = $redis->hGetAll( "webradios" );\
                            $webradioname = array_flip( $webradios );\
                            $data[ "Title" ] = $webradioname[ $file ];\
                        }\
                        $pathinfo = pathinfo( $file );\
                        if ( !isset( $data[ "Artist" ] ) ) $data[ "Artist" ] = basename( $pathinfo[ "dirname" ] );\
                        if ( !isset( $data[ "Title" ] ) ) $data[ "Title" ] = $pathinfo[ "filename" ];\
                        if ( !isset( $data[ "Album" ] ) ) $data[ "Album" ] = "";\
                        $info[] = $data;\
                        $data = NULL;\
                    }\
                    $kv = explode( ": ", $line, 2 );\
                    if ( $kv[ 0 ] !== "OK" && $kv[ 0 ] ) $data[ $kv[ 0 ] ] = $kv[ 1 ];\
                    $line = strtok( "\\n" );\
                }\
                echo json_encode( $info ); //enha1
}
' $file

file=/srv/http/app/libs/runeaudio.php
echo $file
sed -i -e '/browseMode = TRUE/ a\
        if ( preg_match( "/playlist: Webradio/", $plistLine ) ) { //enha0\
            $redis = new Redis();\
            $redis->pconnect( "127.0.0.1" );\
        } //enha1
' -e '/parseFileStr($value/ {
s|^|//xenha|
a\
                $pathinfo = pathinfo( $value ); //enha0\
                $plistArray[ $plCounter ][ "fileext" ] = $pathinfo[ "extension" ];\
                if ( preg_match( "/^Webradio/", $value ) ) {\
                    $webradiourl = $redis->hGet( "webradios", $pathinfo[ "filename" ] );\
                    $plistArray[ $plCounter ][ "url" ] = $webradiourl;\
                } //enha1
}
' -e '/hDel('webradios', $label)/ a\
            $redis->hDel('sampling', $label); //enha
' $file

# start/stop local browser
file=/srv/http/app/settings_ctl.php
echo $file
sed -i '$ a\
if ( $template->local_browser ) { //enha0\
    exec( "/usr/bin/sudo /usr/bin/xinit &> /dev/null &" );\
} else {\
    exec( "/usr/bin/sudo /usr/bin/killall Xorg" );\
} //enha1
' $file

# for rune youtube
[[ -e /usr/local/bin/uninstall_RuneYoutube.sh ]] && sed -i '/id="pl-import-youtube"/ {s/<!--//; s/-->//}' $file

# for nginx svg support
file=/etc/nginx/nginx.conf
if ! grep -q 'ico|svg' $file; then
	echo $file
	sed -i 's/|ico/ico|svg/' $file
	svg=0
else
	svg=1
fi

# local display zoom, encoding, css #######################################

if [[ $1 != u ]]; then
	zoom=$1;
	zoom=$( echo $zoom | awk '{if ($1 < 0.5) print 0.5; else print $1}' )
	zoom=$( echo $zoom | awk '{if ($1 > 3) print 3; else print $1}' )
else
	zoom=$( redis-cli get enhazoom )
	redis-cli del enhazoom &> /dev/null
fi

if ! pacman -Q chromium &> /dev/null; then
	sed -i -e '/zoom-level/ s/^/#/
	' -e '/user-stylesheet-uri/ s/^/#/
	' -e 's/==UTF-8/=UTF-8/
	' -e "/settings/ a\
zoom-level=$zoom
	" /root/.config/midori/config
else
	sed -i "s/\(force-device-scale-factor=\).*/\1$zoom/" /root/.xinitrc
fi

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

# set library home database
if [[ $( redis-cli keys display ) == '' ]]; then
	redis-cli hmset display bar checked pause checked time checked coverart checked volume checked buttons checked source checked\
	\nas checked sd checked usb checked webradio checked albums checked artists checked composer checked genre checked spotify checked dirble checked jamendo checked &> /dev/null
fi

installfinish $@

clearcache

# refresh svg support last for webui installation
[[ $svg == 0 ]] && systemctl reload nginx
