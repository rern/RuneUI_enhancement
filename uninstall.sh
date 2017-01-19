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
rm -v $path'css/customvoloff.css'
rm -v $path'css/pnotify.css'

rm -v $path'img/runelogo.svg'

rm -v $path'js/custom.js'

rm -v $path'js/vendor/hammer.min.js'
rm -v $path'js/vendor/pnotify3.custom.min.js'

title "Restore backup files ..."
file='/etc/nginx/nginx.conf'
mv -v $file'.bak' $file
file='/root/.config/midori/config'
mv -v $file'.bak' $file
path='/srv/http/app/templates/'
file=$path'footer.php'
mv -v $file'.bak' $file
file=$path'header.php'
mv -v $file'.bak' $file
file=$path'playback.php'
mv -v $file'.bak' $file

if [ $arg -eq 0 ]; then # skip if reinstall - uninstall.sh <arg>
	title "Clear PHP OPcache ..."
	curl '127.0.0.1/clear'
	echo

	killall midori
	sleep 1
	startx  > /dev/null 2>&1 &
	echo -e '\nLocal browser restarted.\n'
	
	(( $both == 1 )) && unboth="$runegpio and " || unboth=""
	title2 "$unboth$runeenh successfully uninstalled."
	titleend "$info Refresh browser for default RuneUI."
fi

rm uninstall.sh
