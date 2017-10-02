#!/bin/bash

# $1-zoom
# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh

gitpath=https://github.com/rern/RuneUI_enhancement/raw/master

installstart $1

# backup fonts
mkdir /srv/http/assets/fonts/backup
cp /srv/http/assets/fonts/* /srv/http/assets/fonts/backup &> /dev/null

echo -e "$bar Get files ..."
wgetnc https://github.com/rern/RuneUI_enhancement/archive/master.zip

echo -e "$bar Install new files ..."
rm -rf /tmp/install
mkdir -p /tmp/install
bsdtar -xvf master.zip --strip 1 -C /tmp/install
rm master.zip /tmp/install/* &> /dev/null

chown -R root:root /tmp/install
chown -R http:http /tmp/install/srv
chmod -R 755 /tmp/install

cp -rp /tmp/install/* /
rm -r /tmp/install
echo

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
<div id="lyricfade" class="hide"></div>
' -e $'/class="home"/ i\
    <img class="logo" src="<?=$this->asset(\'/img/runelogo.svg\')?>" alt="RuneAudio" href="/">\
	<?php $path = $_SERVER["REQUEST_URI"] == "/" ? "/#playback" : "/";?>
' -e 's|/#playback|<?=$path;?>|
' -e '/dropdown-menu/ a\
            <li id="dropdownbg"></li> <!-- box-shadow -->
' -e 's/<a id="menu-settings" class="dropdown-toggle"/<button id="menu-settings" class="btn-default dropdown-toggle"/
' -e 's|href="#">MENU <i class="fa fa-bars dx"></i></a>|href="#"><i class="fa fa-gear"></i></button>|
' -e '\|href="/"><i class="fa fa-play"| s|^|<?php /\*|; \|href="/"><i class="fa fa-play"| s|$|\*/?>|
' -e $'/poweroff-modal/ i\
            <li class="<?=$this->uri(1, \'dev\', \'active\')?>"><a href="/dev/"><i class="fa fa-code"></i> Development</a></li>
' -e '/logo.png/ s|^|<?php /\*|; /logo.png/ s|$|\*/?>|
' -e 's|"fa fa-music"></i> Library|"fa fa-folder-open"></i>|
' -e $'s|"tab"\')?>><i class="fa fa-play"></i> Playback|"tab"\')?>><i class="fa fa-play-circle"></i>|
' -e 's|"fa fa-list"></i> Queue|"fa fa-list"></i>|
' $file
# no RuneUI GPIO
! grep -q 'pnotify.css' $file &&
	sed -i $'/runeui.css/ a\    <link rel="stylesheet" href="<?=$this->asset(\'/css/pnotify.css\')?>">' $file

file=/srv/http/app/templates/footer.php
echo $file
echo '<script src="<?=$this->asset('"'"'/js/custom.js'"'"')?>"></script>' >> $file
! grep -q 'hammer.min.js' $file && 
echo '<script src="<?=$this->asset('"'"'/js/vendor/hammer.min.js'"'"')?>"></script>' >> $file
# no RuneUI GPIO
! grep -q 'pnotify3.custom.min.js' $file &&
echo '<script src="<?=$this->asset('"'"'/js/vendor/pnotify3.custom.min.js'"'"')?>"></script>' >> $file

file=/srv/http/app/templates/playback.php
echo $file
sed -i -e '/<div class="tab-content">/ i\
<?php include "playbackcustom.php";\
/\*
' -e '/<!-- LIBRARY PANEL -->/ i\enh \*/?>
' -e '/id="db-level-up"/ {
s/^/<!--enh/
s/$/enh-->/
i\
            <div id="db-currentpath" class="hide">\
                <i id="db-home" class="fa fa-folder-open"></i> <span>Home</span>\
                <i id="db-up" class="fa fa-arrow-left"></i>\
            </div>
}
' -e '/db-currentpath/ {N;N; s/^/<!--enh/; s/$/enh-->/}
' $file

# for nginx svg support
file=/etc/nginx/nginx.conf
if ! grep '|ico' $nginx | grep -q 'svg'; then
	echo $file
	sed -i 's/|ico/&|svg/' $file
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

installfinish $1

# refresh svg support last for webui installation
systemctl reload nginx
