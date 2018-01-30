#!/bin/bash

# $1-zoom
# change version number in RuneAudio_Addons/srv/http/addonslist.php

# temp fix - to be removed
sed -i '/id="bartop"\|id="barbottom"/ d' /srv/http/app/templates/footer.php

alias=enha

. /srv/http/addonstitle.sh

installstart $@

mv /srv/http/app/coverart_ctl.php{,.backup}

getinstallzip

# modify files #######################################
echo -e "$bar Modify files ..."

file=/srv/http/app/playback_ctl.php
echo $file
sed -i '$ a\
$template->local_browser = $redis->get("local_browser");
' $file

file=/srv/http/app/templates/header.php
echo $file
sed -i -e 's/RuneAudio - RuneUI/RuneUIe/
' -e $'/runeui.css/ a\
    <link rel="stylesheet" href="<?=$this->asset(\'/css/custom.css\')?>">
' -e '/id="menu-top"/ i\
<div id="bartop"></div>\
<div id="barbottom"></div>
' -e $'/class="home"/ i\
    <a href="http://www.runeaudio.com/forum/raspberry-pi-f7.html" target="_blank" alt="RuneAudio Forum">\
        <img class="logo" src="<?=$this->asset(\'/img/runelogo.svg\')?>">\
    </a>
' -e '/dropdown-menu/ a\
            <li id="dropdownbg"></li> <!-- box-shadow -->
' -e 's|<a\( id="menu-settings" class="dropdown-toggle\)"|<button\1 btn-default"/|
' -e 's|\(href="#">\)MENU\s*\(.*\)bars dx"></i></a>|\1\2gear"></i></button>|
' -e '\|href="/"><i class="fa fa-play"| {s|^|<?php /\*|; s|$|\*/?>|}
' -e $'/Credits/ a\
            <li class="<?=$this->uri(1, \'dev\', \'active\')?>"><a href="/dev/"><i class="fa fa-code"></i> Development</a></li>
' -e '\|logo.png| {s|^|<?php /\*|; s|$|\*/?>|}
' -e 's|href="/#panel-sx"||; s|href="/#playback"||; s|href="/#panel-dx"||
' -e 's|\("tab".*"fa fa-\)music"></i> Library|\1folder-open"></i>|
' -e 's|\("tab".*"fa fa-play\)"></i> Playback|\1-circle"></i>|
' -e 's|\("tab".*"fa fa-list"></i>\) Queue|\1|
' $file

file=/srv/http/app/templates/footer.php
echo $file
sed -i '1 i\
<div id="bartop"></div>\
<div id="barbottom"></div>
' $file
# must be before lyrics addon
if ! grep -q 'lyrics.js' $file; then
	sed -i '$ a\<script src="<?=$this->asset(\'/js/custom.js\')?>"></script>' $file
else
	sed -i $'/lyrics.js/ i\<script src="<?=$this->asset(\'/js/custom.js\')?>"></script>' $file
fi
! grep -q 'hammer.min.js' $file && sed -i $'<script src="<?=$this->asset(\'/js/vendor/hammer.min.js\')?>"></script>' $file
! grep -q 'propagating.js' $file && sed -i $'<script src="<?=$this->asset(\'/js/vendor/propagating.js\')?>"></script>' $file
# 0.4b
if grep -q 'jquery-ui.js' $file; then
	sed -i -e 's/<.*jquery-ui.js.*script>/<!--&-->/
	' -e $'/jquery-ui.js/ a\
<script src="<?=$this->asset(\'/js/vendor/jquery-ui.min.js\')?>"></script>
	' $file
else
	rm /srv/http/assets/js/vendor/jquery-ui.min.js
fi

file=/srv/http/app/templates/playback.php
echo $file
release=$( redis-cli get release )
if [[ $release == 0.4b ]]; then
sed -i -e '1 i\
<?php\
if ( $this->localSStime == -1 && $this->remoteSStime == -1 ) {\
	echo "\
		<script>\
			var localSStime = -1;\
			var remoteSStime = -1;\
		</script>\
	";\
} else {\
?>
' -e '/<div class="tab-content">/ i\
<?php\
}\
?>
' $file
fi
sed -i -e '/<div class="tab-content">/ i\
<?php include "playbackcustom.php";\
/\*
' -e '/id="context-menus"/ i\enh \*/?>
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

# for 0.3 - no songinfo and screensaver
file=/srv/http/app/templates/playbackcustom.php
if [[ $release != 0.4b ]]; then
	sed -i '/0.4b only/,/0.4b only/ d' /srv/http/assets/js/custom.js
	sed -i '/id="songinfo-open"/ d' $file
fi

# for rune youtube
[[ -e /usr/local/bin/uninstall_RuneYoutube.sh ]] && sed -i '/id="pl-import-youtube"/ {s/<!--//; s/-->//}' $file

if [[ $1 == u ]]; then
	installfinish $@
	clearcache
	exit
fi

# for nginx svg support
file=/etc/nginx/nginx.conf
if ! grep '|ico' $file | grep -q 'svg'; then
	echo $file
	sed -i 's/|ico/&|svg/' $file
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
	zoom=$( redis-cli get enhazoom &> /dev/null )
	redis-cli del enhazoom &> /dev/null
fi

if ! pacman -Qi chromium &> /dev/null; then
	sed -i -e '/zoom-level/ s/^/#/
	' -e '/user-stylesheet-uri/ s/^/#/
	' -e 's/==UTF-8/=UTF-8/
	' -e "/settings/ a\
zoom-level=$zoom
	" /root/.config/midori/config
else
	sed -i "s/force-device-scale-factor=.*/force-device-scale-factor=$zoom" /root/.xinitrc
fi

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

# set library home database
if [[ $( redis-cli keys display ) == '' ]]; then
	redis-cli hmset display bar checked time checked coverart checked volume checked buttons checked \
	\nas checked usb checked webradio checked albums checked artists checked composer checked genre checked spotify checked dirble checked jamendo checked &> /dev/null
fi

installfinish $@

clearcache

# refresh svg support last for webui installation
[[ $svg == 0 ]] && systemctl reload nginx
