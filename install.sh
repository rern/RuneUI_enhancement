#!/bin/bash

# $1-zoom
# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh

installstart $@

mv /srv/http/app/coverart_ctl.php{,.backup}

getinstallzip

# modify files #######################################
echo -e "$bar Modify files ..."
file=/srv/http/app/templates/header.php
echo $file
sed -i -e $'/runeui.css/ a\
    <link rel="stylesheet" href="<?=$this->asset(\'/css/custom.css\')?>">\
    <?php if (preg_match(\'/mixer_type[\\\s]+"disabled"/\', file_get_contents(\'/etc/mpd.conf\'))): ?>\
        <link rel="stylesheet" href="<?=$this->asset(\'/css/customvoloff.css\')?>">\
    <?php endif ?>\
    <?php if ($this->coverart == 0): ?>\
        <link rel="stylesheet" href="<?=$this->asset(\'/css/customcoveroff.css\')?>">\
    <?php endif ?> <!-- enhancement -->
' -e '/menu-top/ i\
<div id="barleft"></div>\
<div id="barright"></div>\
' -e $'/class="home"/ i\
    <img class="logo" src="<?=$this->asset(\'/img/runelogo.svg\')?>" alt="RuneAudio" href="/">\
	<?php $path = $_SERVER["REQUEST_URI"] == "/" ? "/#playback" : "/";?>
' -e 's|/#playback|<?=$path;?>|
' -e '/dropdown-menu/ a\
            <li id="dropdownbg"></li> <!-- box-shadow -->
' -e 's/<a id="menu-settings" class="dropdown-toggle"/<button id="menu-settings" class="btn-default dropdown-toggle"/
' -e 's|href="#">MENU <i class="fa fa-bars dx"></i></a>|href="#"><i class="fa fa-gear"></i></button>|
' -e '\|href="/"><i class="fa fa-play"| s|^|<?php /\*|; \|href="/"><i class="fa fa-play"| s|$|\*/?>|
' -e $'/Credits/ a\
            <li class="<?=$this->uri(1, \'dev\', \'active\')?>"><a href="/dev/"><i class="fa fa-code"></i> Development</a></li>
' -e '/logo.png/ s|^|<?php /\*|; /logo.png/ s|$|\*/?>|
' -e 's|"fa fa-music"></i> Library|"fa fa-folder-open"></i>|
' -e $'s|"tab"\')?>><i class="fa fa-play"></i> Playback|"tab"\')?>><i class="fa fa-play-circle"></i>|
' -e 's|"fa fa-list"></i> Queue|"fa fa-list"></i>|
' $file

file=/srv/http/app/templates/footer.php
echo $file
# must be before lyrics addon
if ! grep -q 'lyrics.js' $file; then
	echo '<script src="<?=$this->asset('"'"'/js/custom.js'"'"')?>"></script>' >> $file
else
	sed -i '/lyrics.js/ i\<script src="<?=$this->asset('"'"'/js/custom.js'"'"')?>"></script>' $file
fi
! grep -q 'hammer.min.js' $file && 
echo '<script src="<?=$this->asset('"'"'/js/vendor/hammer.min.js'"'"')?>"></script>' >> $file
! grep -q 'propagating.js' $file && 
echo '<script src="<?=$this->asset('"'"'/js/vendor/propagating.js'"'"')?>"></script>' >> $file
# 0.4b
if grep -q 'jquery-ui.js' $file; then
	sed -i -e 's/<.*jquery-ui.js.*script>/<!--&-->/
	' -e '/jquery-ui.js/ a\
<script src="<?=$this->asset('"'"'/js/vendor/jquery-ui.min.js'"'"')?>"></script>
	' $file
fi

file=/srv/http/app/templates/playback.php
echo $file
release=$( redis-cli get release )
if [[ $release == 0.4b ]]; then
sed -i -e '1 i\
<?php\
$redis = new Redis();\
$redis->pconnect( "127.0.0.1" );\
$localbrowser = $redis->get( "local_browser" );\
if ( $localbrowser ) {\
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

# for 0.3 - no songinfo and screensaver
[[ $release != 0.4b ]] && sed -i '/0.4b only/,/0.4b only/ d' /srv/http/assets/js/custom.js

file=/srv/http/app/templates/playbackcustom.php
# for 0.4b - songinfo butto
[[ $release == 0.4b ]] && sed -i '/id="songinfo-open"/ {s/<!--//; s/-->//}' $file

# for rune youtube
[[ -e /usr/local/bin/uninstall_RuneYoutube.sh ]] && sed -i '/id="pl-import-youtube"/ {s/<!--//; s/-->//}' $file

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
	zoom=$( echo $zoom | awk '{if ($1 > 2) print 2; else print $1}' )
else
	zoom=$( redis-cli get enhazoom &> /dev/null )
	redis-cli del enhazoom &> /dev/null
fi

if [[ $zoom != 0.7 ]]; then
	midori=/root/.config/midori/config
	sed -i -e '/zoom-level/ s/^/#/
	' -e '/user-stylesheet-uri/ s/^/#/
	' -e "/settings/ a\
	zoom-level=$zoom
	" $midori
fi
	
sed -i 's/==UTF-8/=UTF-8/' $midori

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
[[ $1 != u && $svg == 0 ]] && systemctl reload nginx
