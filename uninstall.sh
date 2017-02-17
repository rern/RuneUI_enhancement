#!/bin/bash

# uninstall.sh - RuneUI enhancement
# https://github.com/rern/RuneUI_enhancement

# not installed
#		exit
# uninstall
#		remove files
#		restore files
#		clear opcache
#		restart local browser
# success
#		info
# remove uninstall.sh

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

# check installed #######################################
if [ ! -e /srv/http/assets/css/custom.css ]; then
	title "$info $runeenh not found."
	exit
fi

title2 "Uninstall $runeenh ..."
# remove files #######################################
title "Remove files ..."
rm -v /srv/http/lyrics.php
path='/srv/http/assets/'
rm -v $path'css/custom.css'
rm -v $path'css/customcoveroff.css'
rm -v $path'css/customvoloff.css'
rm -v $path'img/runelogo.svg'
rm -v $path'js/custom.js'
rm -v $path'js/vendor/hammer.min.js'

# no RuneUI GPIO
[ -e /srv/http/assets/css/gpiosettings.css ] && gpio=true || gpio=false
if ! $gpio; then
	rm -v $path'css/pnotify.css'
	rm -v $path'js/vendor/pnotify3.custom.min.js'
fi

# restore modified files #######################################
title "Restore modified files ..."
header='/srv/http/app/templates/header.php'
echo $header
sed -i -e '/custom.css/, /<!-- enhancement -->/ d
' -e '/barleft/, /lyricfade/ d
' -e '/runelogo.svg/ d
' -e '/dropdownbg/ d
' -e 's/<button id="menu-settings" class="btn-default dropdown-toggle"/<a id="menu-settings" class="dropdown-toggle"/
' -e 's|href="#"><i class="fa fa-gear"></i></button>|href="#">MENU <i class="fa fa-bars dx"></i></a>|
' -e '\|href="/"><i class="fa fa-play"| s|^<?php /\*||; \|href="/"><i class="fa fa-play"| s|\*/?>$||
' -e '\|"fa fa-code"></i> Development</a>| d
' -e '/logo.png/ s|^<?php /\*||; /logo.png/ s|\*/?>$||
' -e $'s|"tab"\')?>><i class="fa fa-folder-open"></i></a>|"tab"\')?>><i class="fa fa-music"></i> Library</a>|
' -e $'s|"tab"\')?>><i class="fa fa-play"></i>|"tab"\')?>><i class="fa fa-play"></i> Playback|
' -e 's|"fa fa-list"></i></a>|"fa fa-list"></i> Queue</a>|
' $header
# no RuneUI GPIO
! $gpio && sed -i -e '/pnotify.css/ d' $header

footer='/srv/http/app/templates/footer.php'
echo $footer
sed -i -e '/custom.js/, /hammer.min.js/ d' $footer
# no RuneUI GPIO
! $gpio && sed -i -e '/pnotify3.custom.min.js/ d' $footer

sed -i -e '/playbackcustom.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' /srv/http/app/templates/playback.php

midori='/root/.config/midori/config'
echo $midori
sed -i -e '0, /zoom-level/ {// d}
' -e '/zoom-level/ s/^#//
' -e '/user-stylesheet-uri/ s/^#//
' $midori

# refresh #######################################
title "Clear PHP OPcache ..."
curl '127.0.0.1/clear'
echo

if pgrep midori > /dev/null; then
	killall midori
	sleep 1
	startx  > /dev/null 2>&1 &
	echo -e '\nLocal browser restarted.\n'
fi

title2 "$runeenh successfully uninstalled."
titleend "$info Refresh browser for default RuneUI."

rm uninstall.sh
