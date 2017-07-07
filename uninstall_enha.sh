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
wget -qN https://github.com/rern/tips/raw/master/bash/f_heading.sh; . f_heading.sh; rm f_heading.sh

runeenh=$( textcolor "RuneUI Enhancement" 6 )

# check installed #######################################
if [[ ! -e /srv/http/assets/css/custom.css ]]; then
	title "$info $runeenh not found."
	exit
fi

title2 "Uninstall $runeenh ..."
# remove files #######################################
title "Remove files ..."
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
title "Restore modified files ..."
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
# skip if reinstall - uninstall.sh re (any argument)
(( $# != 0 )) && exit

# refresh #######################################
title "Clear PHP OPcache ..."
curl '127.0.0.1/clear'
echo

if [[ $(redis-cli get local_browser) -eq '1' ]]; then
	killall midori
	sleep 1
	xinit &>/dev/null &
	echo -e '\nLocal browser restarted.\n'
else
	title "$info Local browser was disabled."
	echo 'Re-enable:'
	echo -e '  \e[0;36m0\e[m No'
	echo -e '  \e[0;36m1\e[m Yes'
	echo
	echo -e '\e[0;36m0\e[m / 1 ? '
	read -n 1 answer
	if [[ $answer == 1 ]]; then
		redis-cli set local_browser 1 >/dev/null
		xinit &>/dev/null &
		echo -e '\nLocal browser started.\n';;	
	fi
fi

title2 "$runeenh uninstalled successfully."
titleend "$info Refresh browser for default RuneUI."

rm uninstall_enha.sh
