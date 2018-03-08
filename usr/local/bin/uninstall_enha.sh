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
rm -v /srv/http/app/templates/playbackenhance.php
rm -v /srv/http/{artistbio.php,displayget.php,displaysave.php,page.php}
rm -v /srv/http/artistinfo.php &> /dev/null # tmp: to be removed
path=/srv/http/assets
rm -v $path/css/enhance.css
rm -v $path/img/runelogo.svg
rm -vf $path/js/{enhance.js,vendor/jquery-ui.min.js,vendor/propagating.js}

mv /srv/http/app/coverart_ctl.php{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

file=/srv/http/index.php
echo $file
sed -i '/"page"/ d' $file

file=/srv/http/app/playback_ctl.php
echo $file
sed -i '/template->local_browser/ d' $file

file=/srv/http/app/templates/header.php
echo $file
sed -i -e 's|RuneUIe|RuneAudio - RuneUI|
' -e '/enhance.css\|id="bartop"\|id="barbottom\|dropdownbg\|button id="menu-settings"\|id="pause"\|Development<.a>/ d
' -e '/a href="http:..www.runeaudio.com/, /<.a>/ d
' -e 's|^<?php /\*||; s|\*/?>$||
' -e 's|id="open-panel-sx"><a |&href="/#panel-sx"|
' -e 's|id="open-playback".*><a |&href="/#playback"|
' -e 's|id="open-panel-dx"><a |&href="/#panel-dx"|
' -e 's|\("tab".*"fa fa-\)folder-open"></i></a>|\1music"></i> Library</a>|
' -e 's|\("tab".*"fa fa-play\)-circle"></i>|\1"></i> Playback|
' -e 's|\("tab".*"fa fa-list"></i>\)</a>|\1 Queue</a>|
' $file

file=/srv/http/app/templates/footer.php
echo $file
sed -i -e '/enhance.js/ d
' -e '/propagating.js/ d
' $file
# 0.4b
if grep -q 'jquery-ui.js' $file; then
	sed -i -e '/jquery-ui.js/ {s/^<!--//; s/-->$//}
	' -e '/jquery-ui.min.js/ d
	' $file
fi

# no Addons Menu
if [[ ! -e /usr/local/bin/uninstall_addo.sh ]]; then
	rm $path/js/vendor/hammer.min.js
	sed -i '/hammer.min.js/ d' $file
fi

file=/srv/http/app/templates/playback.php
echo $file
sed -i -e '/^<?php$/,/^?>$/ d
' -e '/playbackenhance.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' $file

file=/srv/http/app/settings_ctl.php
echo $file
sed -i '/if ( \$template->local_browser )/,/^}$/ d' $file

file=/srv/http/assets/js/vendor/jquery.knob.js
echo $file
sed '/DOMMouseScroll/ s|^//||' $file
file=/srv/http/assets/js/vendor/jquery.knob.min.js
echo $file
sed -i 's|/\*###enha###||; s|###enha###\*/||' $file

if [[ $1 != u ]]; then
	file=/root/.config/midori/config
	echo $file
	if grep -q '^#zoom-level' $file; then
		sed -i -e '/^zoom-level/ d
		' -e '/#zoom-level/ s/^#//
		' $file
	fi
	sed -i '/#user-stylesheet-uri/ s/^#//' $file
fi

uninstallfinish $@

[[ $1 != u ]] && clearcache
