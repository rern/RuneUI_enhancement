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
	redis-cli del webradiosampling &> /dev/null
fi

# remove files #######################################
echo -e "$bar Remove files ..."
rm -v /srv/http/app/libs/enhanceradio.php
rm -v /srv/http/app/templates/enhanceplayback.php
rm -v /srv/http/enhance*
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
' -e '/<!--enha-->/ d
' -e 's/<!--enha\|enha-->//g
' -e 's/data-cmd="toggle"/data-cmd="play"/
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
sed -i '\|//enha| d' $file

file=/srv/http/app/settings_ctl.php
echo $file
sed -i '/if ( \$template->local_browser )/,/^}$/ d' $file

file=/srv/http/assets/js/runeui.js
echo $file
sed -i -e '/^\/\*enha\|^enha\*\// d
' -e '/\.countdown(/ s|^//||
' -e 's|fa-spin"></i>|& Updating|
' -e 's|\(#open-panel-sx.).html(.<i class="fa fa-\)folder-open|\1music sx"></i> Library|
' $file

file=/srv/http/app/libs/runeaudio.php
echo $file
sed -i -e '/\/\/enha0$/, /\/\/enha1$/ d
' -e '/^\/\*enha\|^enha\*\// d
' -e '/\/\/enha$/ d
' -e 's/^\/\/xenha//
' $file

file=/root/.config/midori/config
echo $file
sed -i -e '/zoom-level/ d
' -e '/middle-click/ i\
zoom-level=0.7
' -e '/user-stylesheet-uri/ s/^#*//
' $file

file=/srv/http/db/index.php
echo $file
sed -i -e '/echo getPlayQueue($mpd)/ s|^//||
' -e '/\/\/enha0/, /\/\/enha1/ d
' $file

uninstallfinish $@

[[ $1 != u ]] && clearcache
