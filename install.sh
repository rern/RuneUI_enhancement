#!/bin/bash

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
wget -qN https://raw.githubusercontent.com/rern/title_script/master/title.sh; . title.sh; rm title.sh
timestart

runeenh=$( tcolor "RuneUI Enhancement" )

gitpath=https://raw.githubusercontent.com/rern/RuneUI_enhancement/master

# check already installed #######################################
if [[ -e /srv/http/assets/css/custom.css ]]; then
	echo -e "$info $runeenh already installed."
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
else
	(( $1 < 6 )) && anszoom=$1 || anszoom=1
fi

# install #######################################
title -l = "$bar Install $runeenh ..."
echo -e "$bar Get files ..."
wget -qN --show-progress $gitpath/_repo/srv.tar.xz
wget -qN --show-progress $gitpath/uninstall_enha.sh
chmod +x uninstall_enha.sh

# backup fonts
mkdir /srv/http/assets/fonts/backup
cp /srv/http/assets/fonts/* /srv/http/assets/fonts/backup &>/dev/null

# extract files #######################################
echo -e "$bar Install new files ..."
bsdtar -xvf srv.tar.xz -C /
rm srv.tar.xz

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
    <img class="logo" src="<?=$this->asset(\'/img/runelogo.svg\')?>" alt="RuneAudio" href="/">
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
' $playback

 # fix sort webradio, add usb breadcrumb
runeui=/srv/http/assets/js/runeui.js
if ! grep -q 'append(elems)' $runeui; then
	cat > /tmp/herefile <<HEREDOC
        var folder = path.split('/');
        for (i = 0; i < folder.length; i++) {
            folderPath += (i == 0) ? '' : '/';
            folderPath += folder[i].replace("'", "\'");  // escapes ' in getDB param
            folderHref += (i == 0) ? '' : ' / ';
            folderHref += "<a href='javascript:getDB({path : \""+ folderPath +"\"});'>"+ folder[i] +'</a>';
        }
        breadcrumb.html(folderHref);
	HEREDOC
	line=$( sed -n $'/\'Genres\/\' + path/ =' $runeui )

    sed -i -e '/highlighted entry/ a\
            var elems = $("#database-entries li").detach().sort(function (a, b) {\
                return $(a).text().toLowerCase().localeCompare(\$(b).text().toLowerCase());\
            });\
            $("#database-entries").append(elems);
	' -e $(( line + 3 ))' {
        s|^|//|
        r /tmp/herefile
        }
    ' $runeui
    
    sed -i 's/var u=$("span","#db-currentpath")/var elems=$("#database-entries li").detach().sort(function(e,t){return $(e).text().toLowerCase().localeCompare($(t).text().toLowerCase())});$("#database-entries").append(elems);var u=$("span","#db-currentpath")/
    ' ${runeui/.js/.min.js}
fi

# for nginx svg support
nginx=/etc/nginx/nginx.conf
if ! grep '|ico' $nginx | grep -q 'svg'; then
	echo $enginx
	sed -i 's/|ico/&|svg/' $nginx
	systemctl restart nginx
fi

# local display zoom, encoding, css #######################################
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

# refresh #######################################
echo -e "$bar Clear PHP OPcache ..."
curl '127.0.0.1/clear'
echo

if pgrep midori >/dev/null; then
	killall midori
	sleep 1
	xinit &>/dev/null &
	echo 'Local browser restarted.'
fi

timestop
title -l = "$bar $runeenh installed successfully."
echo 'Uninstall: ./uninstall_enha.sh'
title -nt "$info Refresh browser to start."
