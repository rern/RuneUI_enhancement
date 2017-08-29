#!/bin/bash

# uninstall_enha.sh - RuneUI enhancement
# https://github.com/rern/RuneUI_enhancement

# not installed
#	exit
# uninstall
#	remove files
#	restore files
#	clear opcache
#	restart local browser
# success
#	info
# remove uninstall_enha.sh

# import heading function
wget -qN https://github.com/rern/title_script/raw/master/title.sh; . title.sh; rm title.sh
runeenh=$( tcolor "RuneUI Enhancement" )

# check installed #######################################
if [[ ! -e /srv/http/assets/css/custom.css ]]; then
	echo -e "$info $runeenh not found."
	exit
fi

title -l = $bar Uninstall $runeenh ...
# remove files #######################################
echo -e "$bar Remove files ..."
rm -v /srv/http/app/templates/playbackcustom.php
rm -v /srv/http/lyrics.php
path=/srv/http/assets/
rm -v $path'css/custom.css'
rm -v $path'css/customcoveroff.css'
rm -v $path'css/customvoloff.css'
rm -v $path'img/runelogo.svg'
rm -v $path'js/custom.js'
rm -v $path'js/vendor/hammer.min.js'

# no RuneUI GPIO
[[ -e /srv/http/assets/css/gpiosettings.css ]] && gpio=true || gpio=false
if ! $gpio; then
	rm -v $path'css/pnotify.css'
	rm -v $path'js/vendor/pnotify3.custom.min.js'
fi

# restore fonts
cp -f /srv/http/assets/fonts/backup/* /srv/http/assets/fonts &>/dev/null
rm -rf /srv/http/assets/fonts/backup

# restore modified files #######################################
echo -e "$bar Restore modified files ..."
header=/srv/http/app/templates/header.php
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

footer=/srv/http/app/templates/footer.php
echo $footer
sed -i -e '/custom.js/, /hammer.min.js/ d' $footer
# no RuneUI GPIO
! $gpio && sed -i -e '/pnotify3.custom.min.js/ d' $footer

sed -i -e '/playbackcustom.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' -e '/^\s\+<div id="db-currentpath"/,/<\/div>/ d
' -e 's/<!--enh\|enh-->//g
' /srv/http/app/templates/playback.php

midori=/root/.config/midori/config
echo $midori
sed -i -e '/^zoom-level/ d
' -e '/#zoom-level/ s/^#//
' -e '/#user-stylesheet-uri/ s/^#//
' $midori
if grep -q '#default-encoding' $midori; then
	sed -i -e '/^default-encoding/ d
	' -e '/#default-encoding/ s/^#//
	' $midori
fi

redis-cli hset addons enha 0 &> /dev/null
# skip if reinstall - uninstall.sh re (any argument)
(( $# != 0 )) && exit

# refresh #######################################
echo -e "$bar Clear PHP OPcache ..."
systemctl reload php-fpm
echo

if [[ $(redis-cli get local_browser) -eq '1' ]]; then
	killall midori
	sleep 1
	xinit &>/dev/null &
	echo -e '\nLocal browser restarted.\n'
else
	echo -e "$info Local browser was disabled."
	yesno "Re-enable:" answer
	if [[ $answer == 1 ]]; then
		redis-cli set local_browser 1 >/dev/null
		xinit &>/dev/null &
		echo -e '\nLocal browser started.\n'	
	fi
fi

title -l = "$bar $runeenh uninstalled successfully."
title -nt "$info Refresh browser for default RuneUI."

rm $0
