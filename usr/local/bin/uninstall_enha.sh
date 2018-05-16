#!/bin/bash

alias=enha

. /srv/http/addonstitle.sh

uninstallstart $@

if [[ $1 == u ]]; then
	if ! pacman -Q chromium &> /dev/null; then
		zoom=$( grep '^zoom' /root/.config/midori/config | cut -d'=' -f2 )
	else
		zoom=$( grep '^force-device-scale-factor' /root/.xinitrc | cut -d'=' -f2 )
	fi
	redis-cli set enhazoom $zoom &> /dev/null
else
	redis-cli del display &> /dev/null
fi

# remove files #######################################
echo -e "$bar Remove files ..."
rm -v /srv/http/app/templates/enhanceplayback.php
rm -v /srv/http/{enhancebio.php,enhancestatus.sh,enhancevolume.sh}
[[ ! -e /usr/local/bin/uninstall_addo.sh ]] && rm -v /srv/http/enhanceredis.php
path=/srv/http/assets
rm -v $path/css/{enhance.css,midori.css,roundslider.min.css}
rm -v $path/img/{controls.svg,runelogo.svg}
rm -v $path/js/enhance.js
rm -vf $path/js/vendor/{jquery-ui.min.js,roundslider.min.js}

mv /srv/http/app/coverart_ctl.php{.backup,}
mv $path/js/runeui.min.js{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

file=/srv/http/app/templates/header.php
echo $file
sed -i -e 's|RuneUIe|RuneAudio - RuneUI|
' -e '/roundslider.min.css\|enhance.css\|id="bartop"\|id="barbottom\|dropdownbg\|button id="menu-settings"\|id="pause"\|Development<.a>/ d
' -e '/fa-folder-open"><.i><.a>/,/fa-list"><.i><.a>/ d
' -e '/a href="http:..www.runeaudio.com/, /<.a>/ d
' -e 's/data-cmd="toggle"/data-cmd="play"/
' -e 's/<!--enha\|enha-->//g
' -e 's|\("tab".*"fa fa-\)folder-open"></i></a>|\1music"></i> Library</a>|
' -e 's|\("tab".*"fa fa-play\)-circle"></i>|\1"></i> Playback|
' -e 's|\("tab".*"fa fa-list"></i>\)</a>|\1 Queue</a>|
' $file

file=/srv/http/app/templates/footer.php
echo $file
sed -i -e 's/<!--enha\|enha-->//g
' -e '/roundslider.min.js\|enhance.js\|vendor.jquery-ui.min.js/ d
' $file

# no Addons Menu
if [[ ! -e /usr/local/bin/uninstall_addo.sh ]]; then
	sed -i '/hammer.min.js\|propagating.js/ d' $file
	rm $path/js/vendor/{hammer.min.js,propagating.js}
fi

file=/srv/http/app/templates/playback.php
echo $file
sed -i -e '/^<?php$/,/^?>$/ d
' -e '/enhanceplayback.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' $file

file=/srv/http/app/settings_ctl.php
echo $file
sed -i '/if ( \$template->local_browser )/,/^}$/ d' $file

file=/srv/http/assets/js/runeui.js
echo $file
sed -i -e '/^\/\*enha\|^enha\*\// d
' -e '/\.countdown(/ s|^//||
' -e 's|fa-spin"></i>|& Updating|
' -e 's|fa-folder-open"></i>|fa-music sx"></i> Library|
' $file


file=/root/.config/midori/config
echo $file
sed -i -e '/zoom-level/ d
' -e '/middle-click/ i\
zoom-level=0.7
' -e '/user-stylesheet-uri/ s/^#*//
' $file

uninstallfinish $@

[[ $1 != u ]] && clearcache
