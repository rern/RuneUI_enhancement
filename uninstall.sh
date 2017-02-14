#!/bin/bash

# uninstall.sh - RuneUI enhancement
# https://github.com/rern/RuneUI_enhancement

# not installed
#		exit
# gpio installed
#		exit
#		uninstall gpio
#		uninstall both
#			gpiouninstall.sh
# uninstall
#		remove files
#		restore files
#		clear opcache
#		restart midori
# success (skip if install with gpioinstall.sh)
#		info
# remove install files

arg=$#
both=0

linered='\e[0;31m---------------------------------------------------------\e[m'
line2='\e[0;36m=========================================================\e[m'
line='\e[0;36m---------------------------------------------------------\e[m'
bar=$( echo -e "$(tput setab 6)   $(tput setab 0)" )
warn=$( echo $(tput setab 1) ! $(tput setab 0) )
info=$( echo $(tput setab 6; tput setaf 0) i $(tput setab 0; tput setaf 7) )
runeenh=$( echo $(tput setaf 6)RuneUI Enhancement$(tput setaf 7) )
runegpio=$( echo $(tput setaf 6)RuneUI GPIO$(tput setaf 7) )

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

if ! grep -qs 'RuneUIe' /srv/http/app/templates/header.php; then
	title "$info $runeenh not found."
	exit
fi

if [ $arg -eq 0 ]; then # skip if reinstall - uninstall.sh <arg>
	if grep -qs 'id="gpio"' /srv/http/app/templates/header.php; then
		title "$info $runegpio found."
		echo 'Uninstall:'
		echo -e '  \e[0;36m0\e[m Cancel'
		echo -e '  \e[0;36m1\e[m' $runegpio 'only'
		echo -e '  \e[0;36m2\e[m' $runegpio '+' $runeenh
		echo
		echo -e '\e[0;36m0\e[m / 1 / 2 ? '
		read -n 1 answer
		case $answer in
			1 ) ./gpiouninstall.sh # uninstall RuneUI GPIO
					exit;;
			2 ) ./gpiouninstall.sh enh # uninstall both
					both=1;;
			* ) echo
					titleend 'Uninstall cancelled.'
					exit;;
		esac
	fi
fi

# uninstall #######################################

title2 "Uninstall $runeenh ..."
title "Remove files ..."
rm -v /srv/http/lyrics.php
path='/srv/http/assets/'
rm -v $path'css/custom.css'
rm -v $path'css/customcoveroff.css'
rm -v $path'css/customvoloff.css'
rm -v $path'css/pnotify.css'

rm -v $path'img/runelogo.svg'

rm -v $path'js/custom.js'

rm -v $path'js/vendor/hammer.min.js'
rm -v $path'js/vendor/pnotify3.custom.min.js'

# restore modified files #######################################
sed -i -e 's|<title>RuneAudio - RuneUIe<\/title>|<title>RuneAudio - RuneUI<\/title>|
' -e '\|pnotify.css|,\|<!-- enhancement -->| d
' -e '\|barleft|,\|lyricfade| d
' -e '\|runelogo.svg| d
' -e '\|dropdownbg| d
' -e 's|<button id="menu-settings" class="btn-default dropdown-toggle"|<a id="menu-settings" class="dropdown-toggle"|
' -e 's|href="#"><i class="fa fa-gear"></i></button>|href="#">MENU <i class="fa fa-bars dx"></i></a>|
' -e '\|href="/"><i class="fa fa-play"| s|^<?php /\*||; \|href="/"><i class="fa fa-play"| s|\*/?>$||
' -e '\|"fa fa-code"><\/i> Development<\/a>| d
' -e '\|logo.png| s|^<?php /\*||; \|logo.png| s|\*/?>$||
' -e $'s|"tab"\')?>><i class="fa fa-folder-open"></i></a>|"tab"\')?>><i class="fa fa-music"></i> Library</a>|
' -e $'s|"tab"\')?>><i class="fa fa-play"></i>|"tab"\')?>><i class="fa fa-play"></i> Playback|
' -e 's|"fa fa-list"></i></a>|"fa fa-list"></i> Queue</a>|
' /srv/http/app/templates/header.php

sed -i -e '\|pnotify3.custom.min.js|,\|hammer.min.js| d' /srv/http/app/templates/footer.php

sed -i -e '\|playbackcustom.php|,\|/\*| d
' -e '\|enh \*/?>| d
' /srv/http/app/templates/playback.php

if ! grep -qs 'logout.php' /srv/http/app/templates/header.php; then
	sed -i 's/|ico|svg/|ico/' /etc/nginx/nginx.conf
fi

sed -i -e 's|zoom-level=...|zoom-level=0.7|
' -e '\|user-stylesheet-uri| s|^#||
' /root/.config/midori/config

if [ $arg -eq 0 ]; then # skip if reinstall - uninstall.sh <arg>
	title "Clear PHP OPcache ..."
	curl '127.0.0.1/clear'
	echo

	if pgrep midori > /dev/null; then
		killall midori
		sleep 1
		startx  > /dev/null 2>&1 &
		echo -e '\nLocal browser restarted.\n'
	fi
	
	(( $both == 1 )) && unboth="$runegpio and " || unboth=""
	title2 "$unboth$runeenh successfully uninstalled."
	titleend "$info Refresh browser for default RuneUI."
fi

rm uninstall.sh
