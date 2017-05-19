#!/bin/bash

# remove install file
# install.sh - RuneUI enhancement
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

rm install.sh

linered='\e[0;31m---------------------------------------------------------\e[m'
line2='\e[0;36m=========================================================\e[m'
line='\e[0;36m---------------------------------------------------------\e[m'
bar=$( echo -e "$(tput setab 6)   $(tput setab 0)" )
warn=$( echo $(tput setab 1) ! $(tput setab 0) )
info=$( echo $(tput setab 6; tput setaf 0) i $(tput setab 0; tput setaf 7) )
runeenh=$( echo $(tput setaf 6)RuneUI Enhancement$(tput setaf 7) )

# functions #######################################
title2() {
	echo -e "\n$line2\n"
	echo -e "$bar $1"
	echo -e "\n$line2\n"
}
title() {
	echo -e "\n$line"
	echo $1
	echo -e "$line\n"
}
titleend() {
	echo -e "\n$1"
	echo -e "\n$line\n"
}

# check already installed #######################################
if [[ -e /srv/http/assets/css/custom.css ]]; then
	title "$info $runeenh already installed."
	echo 'Reinstall' $runeenh':'
	echo -e '  \e[0;36m0\e[m No'
	echo -e '  \e[0;36m1\e[m Yes'
	echo
	echo -e '\e[0;36m0\e[m / 1 ? '
	read -n 1 answer
	case $answer in
		1 ) ./uninstall.sh re;;
		* ) echo
			titleend "$runeenh reinstall cancelled."
			exit;;	
	esac
fi

# install RuneUI enhancement #######################################
title2 "Install $runeenh ..."
title "Get files ..."
wget -q --show-progress -O srv.tar.xz "https://github.com/rern/RuneUI_enhancement/blob/master/_repo/srv.tar.xz?raw=1"
wget -q --show-progress -O uninstall_enha.sh "https://github.com/rern/RuneUI_enhancement/blob/master/uninstall_enha.sh?raw=1"
chmod +x uninstall_enha.sh

# extract files #######################################
title "Install new files ..."
bsdtar -xvf srv.tar.xz -C /
rm srv.tar.xz

# modify files #######################################
title "Modify files ..."
header='/srv/http/app/templates/header.php'
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
' -e $'s|"tab"\')?>><i class="fa fa-play"></i> Playback|"tab"\')?>><i class="fa fa-play"></i>|
' -e 's|"fa fa-list"></i> Queue|"fa fa-list"></i>|
' $header
# no RuneUI GPIO
! grep -q 'pnotify.css' $header &&
	sed -i $'/runeui.css/ a\    <link rel="stylesheet" href="<?=$this->asset(\'/css/pnotify.css\')?>">' $header

footer='/srv/http/app/templates/footer.php'
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

playback='/srv/http/app/templates/playback.php'
echo $playback
sed -i -e '/<div class="tab-content">/ i\
<?php include "playbackcustom.php";\
/\*
' -e '/<!-- LIBRARY PANEL -->/ i\enh \*/?>
' $playback

# for nginx svg support
nginx='/etc/nginx/nginx.conf'
if ! grep '|ico' $nginx | grep -q 'svg'; then
	echo $enginx
	sed -i 's/|ico/&|svg/' $nginx
	systemctl restart nginx
fi

# local display zoom, encoding, css #######################################
#zoom=$(sed -n '/^zoom-level/ s/zoom-level=//p' /root/.config/midori/config)
#if [[ $(redis-cli get local_browser) -eq '1' ]]; then
	title "$info Select local browser screen size:"
	echo 'Set zoom level for display directly connect to RPi.'
	echo
	echo 'Screen size:'
	echo -e '  \e[0;36m1\e[m Small     ( 0.7 : width less than 800px )'
	echo -e '  \e[0;36m2\e[m Medium    ( 1.2 : HD - 1280px )'
	echo -e '  \e[0;36m3\e[m Large     ( 1.5 : Full HD - 1920px )'
	echo -e '  \e[0;36m4\e[m Custom    ( user define )'
	echo -e '  \e[0;36m5\e[m Text only ( save some cpu cycles )'
	echo
	echo -e '\e[0;36m1\e[m / 2 / 3 / 4 / 5 ? '
	read -n 1 answer
	case $answer in
		2 ) zoom=1.2;;
		3 ) zoom=1.5;;
		4 ) echo
			echo 'Custom scale:'
			read ans 
			zoom=$ans;;
		5 ) redis-cli set local_browser 0 > /dev/null
			killall midori
			echo -e '\nLocal browser disabled.'
			echo -e 'Re-enable: Menu > Settings > Local browser\n';;
		* ) zoom=0.7;;
	esac
#fi
midori='/root/.config/midori/config'
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

# refresh #######################################
title "Clear PHP OPcache ..."
curl '127.0.0.1/clear'
echo

if pgrep midori > /dev/null; then
	killall midori
	sleep 1
	xinit > /dev/null 2>&1 &
	echo -e '\nLocal browser restarted.\n'
fi

title2 "$runeenh successfully installed."
echo "Uninstall:   ./uninstall_enha.sh"
titleend "$info Refresh browser to start."
