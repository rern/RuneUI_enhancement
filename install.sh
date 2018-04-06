#!/bin/bash

# $1-zoom
# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh

installstart $@

mv /srv/http/app/coverart_ctl.php{,.backup}
mv /srv/http/assets/js/runeui.min.js{,.backup}

getinstallzip

# modify files #######################################
echo -e "$bar Modify files ..."

file=/srv/http/app/templates/header.php
echo $file
sed -i -e 's/RuneAudio - RuneUI/RuneUIe/
' -e $'/runeui.css/ a\
    <link rel="stylesheet" href="<?=$this->asset(\'/css/roundslider.min.css\')?>">\
    <link rel="stylesheet" href="<?=$this->asset(\'/css/enhance.css\')?>">
' -e '/id="menu-top"/ {
i\
<div id="bartop"></div>\
<div id="barbottom"></div>
n; a\
        <button id="menu-settings" class="dropdown-toggle btn-default" role="button" data-toggle="dropdown" data-target="#" href="#"><i class="fa fa-gear"></i></button>
}
' -e $'/class="home"/ i\
    <a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank" alt="RuneAudio Forum">\
        <img class="logo" src="<?=$this->asset(\'/img/runelogo.svg\')?>">\
    </a>
' -e '/id="play"/ a\
        <button id="pause" class="btn btn-default btn-cmd" title="Pause" data-cmd="play"><i class="fa fa-pause"></i></button>
' -e '/^\s*<a id="menu-settings"\|id="clock-display"\|href="\/"><i class="fa fa-play"\|logo.png/ {s/^/<!--enha/; s/$/enha-->/}
' -e '/dropdown-menu/ a\
            <li id="dropdownbg"></li>
' -e $'/Credits/ a\
            <li class="<?=$this->uri(1, \'dev\', \'active\')?>"><a href="/dev/"><i class="fa fa-code"></i> Development</a></li>
' -e '/id="open-panel-sx"/ s/^/<!--enha/
' -e '/id="open-panel-dx"/ {
s/$/enha-->/
a\
        <li id="open-panel-sx"><a><i class="fa fa-folder-open"></i></a></li>\
        <li id="open-playback" class="active"><a><i class="fa fa-play-circle"></i></a></li>\
        <li id="open-panel-dx"><a><i class="fa fa-list"></i></a></li>
}
' $file

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
<?php\
if ( $this->remoteSStime != -1 ) {\
?>
' -e '/<div class="tab-content">/ i\
<?php\
}\
?>
' $file
fi
sed -i -e '/<div class="tab-content">/ i\
<?php include "enhanceplayback.php";\
/\*
' -e '/id="context-menus"/ i\enh \*/?>
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

# start/stop local browser
file=/srv/http/app/settings_ctl.php
echo $file
sed -i '$ a\
if ( $template->local_browser ) {\
    exec( "/usr/bin/sudo /usr/bin/xinit &> /dev/null &" );\
} else {\
    exec( "/usr/bin/sudo /usr/bin/killall Xorg" );\
}
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
	redis-cli hmset display bar checked pause checked time checked coverart checked volume checked buttons checked \
	\nas checked usb checked webradio checked albums checked artists checked composer checked genre checked spotify checked dirble checked jamendo checked &> /dev/null
fi

installfinish $@

clearcache

# refresh svg support last for webui installation
[[ $svg == 0 ]] && systemctl reload nginx
