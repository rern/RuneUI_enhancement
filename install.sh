#!/bin/bash

version=20170901

# install.sh [screen resolution]

# https://github.com/rern/RuneUI_enhancement

# remove install.sh
# already installed
#	reinstall ?
#		exit
#		uninstall
# install
#	get uninstall.sh
#	get tar.xz
#	modify files
#	extract
#	remove tar.xz
#	restart nginx
#	clear opcache
#	restart local browser
# success
#	info

rm $0

# import heading function
wget -qN https://github.com/rern/title_script/raw/master/title.sh; . title.sh; rm title.sh

runeenh=$( tcolor "RuneUI Enhancement" )

gitpath=https://github.com/rern/RuneUI_enhancement/raw/master

# check already installed #######################################
if [[ -e /srv/http/assets/css/custom.css ]]; then
	echo -e "$info $runeenh already installed."
	[[ ! -t 1 ]] && exit
	yesno "Reinstall $runeenh:" ansre
	[[ $answre != 1 ]] && exit
	./uninstall.sh re
fi

# user inputs
if (( $# == 0 )); then
	echo -e "$info Select local browser screen size:"
	echo 'Set zoom level to display directly connect to RPi.'
	echo
	echo 'Screen size:'
	echo -e '  \e[0;36m1\e[m Small     ( 0.7 : width less than 800px )'
	echo -e '  \e[0;36m2\e[m Medium    ( 1.2 : HD - 1280px )'
	echo -e '  \e[0;36m3\e[m Large     ( 1.5 : Full HD - 1920px )'
	echo -e '  \e[0;36m4\e[m Custom    ( user define )'
	echo -e '  \e[0;36m5\e[m Text only ( save some cpu cycles )'
	echo
	echo -e '\e[0;36m1\e[m / 2 / 3 / 4 / 5 ? '
	read -n 1 anszoom
	echo
	if [[ $anszoom == 4 ]]; then
		echo
		echo 'Custom scale:'
		read anszoomcustom
	fi
fi

# backup fonts
mkdir /srv/http/assets/fonts/backup
cp /srv/http/assets/fonts/* /srv/http/assets/fonts/backup &> /dev/null

# install #######################################
[[ $1 != u ]] && title -l = "$bar Install $runeenh ..."
echo -e "$bar Get files ..."
wgetnc https://github.com/rern/RuneUI_enhancement/archive/master.zip

echo -e "$bar Install new files ..."
rm -rf /tmp/install
mkdir -p /tmp/install
bsdtar -xf master.zip --strip 1 -C /tmp/install
rm master.zip /tmp/install/* &> /dev/null

chown -R root:root /tmp/install
chown -R http:http /tmp/install/srv
chmod -R 755 /tmp/install

cp -rp /tmp/install/* /
rm -r /tmp/install
echo

# modify files #######################################
echo -e "$bar Modify files ..."
header=/srv/http/app/templates/header.php
echo $header
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
' $header
# no RuneUI GPIO
! grep -q 'pnotify.css' $header &&
	sed -i $'/runeui.css/ a\    <link rel="stylesheet" href="<?=$this->asset(\'/css/pnotify.css\')?>">' $header

footer=/srv/http/app/templates/footer.php
echo $footer
sed -i $'$ a\
<script src="<?=$this->asset(\'/js/custom.js\')?>"></script>\
<script src="<?=$this->asset(\'/js/vendor/hammer.min.js\')?>"></script>
' $footer
# no RuneUI GPIO
! grep -q 'pnotify3.custom.min.js' $footer &&
sed -i $'$ a\
<script src="<?=$this->asset(\'/js/vendor/pnotify3.custom.min.js\')?>"></script>
' $footer

playback=/srv/http/app/templates/playback.php
echo $playback
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
' $playback

# for nginx svg support
nginx=/etc/nginx/nginx.conf
if ! grep '|ico' $nginx | grep -q 'svg'; then
	echo $enginx
	sed -i 's/|ico/&|svg/' $nginx
fi

# local display zoom, encoding, css #######################################
if (( $# == 0 )); then
    case $anszoom in
	    2 ) zoom=1.2;;
    	3 ) zoom=1.5;;
	    4 ) zoom=$anszoomcustom;;
	    5 ) redis-cli set local_browser 0 >/dev/null
	    	killall midori
	    	echo -e '\nLocal browser disabled.'
	    	echo -e 'Re-enable: Menu > Settings > Local browser\n';;
    	* ) zoom=0.7;;
    esac
else
	if [[ $1 != u ]]; then
		zoom=$1;
	else
		zoom=$( redis-cli get enhazoom &> /dev/null )
		redis-cli del enhazoom &> /dev/null
	fi
	zoom=$( echo $zoom | awk '{if ($1 < 0.5) print 0.5; else print $1}' )
	zoom=$( echo $zoom | awk '{if ($1 > 2) print 2; else print $1}' )
fi


midori=/root/.config/midori/config
sed -i -e '/zoom-level/ s/^/#/
' -e '/user-stylesheet-uri/ s/^/#/
' -e "/settings/ a\
zoom-level=$zoom
" $midori
	
if ! grep -q 'default-encoding=UTF-8' $midori; then
	sed -i -e '/default-encoding/ s/^/#/
	' -e '/settings/ a\default-encoding=UTF-8
	' $midori
fi

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null
redis-cli hset addons enha $version &> /dev/null

if [[ $1 != u ]]; then
	title -l = "$bar $runeenh installed successfully."
	[[ -t 1 ]] && echo 'Uninstall: uninstall_enha.sh'
	title -nt "$info Refresh browser to start."
else
	title -l = "$bar $runeenh updated successfully."
fi

# clear opcache if run from terminal #######################################
[[ -t 1 ]] && systemctl reload php-fpm

# restart local browser #######################################
if pgrep midori > /dev/null; then
	killall midori
	sleep 1
	xinit &> /dev/null &
fi

# refresh svg support last for webui installation
systemctl reload nginx
