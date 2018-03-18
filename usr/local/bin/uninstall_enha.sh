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
rm -v /srv/http/enhancebio.php
[[ ! -e /usr/local/bin/uninstall_addo.sh ]] && rm -v /srv/http/enhanceredis.php
path=/srv/http/assets
rm -v $path/css/{enhance.css,roundslider.min.css}
rm -v $path/img/runelogo.svg
rm -v $path/js/enhance.js
rm -vf $path/js/vendor/{jquery-ui.min.js,propagating.js,roundslider.min.js}

mv /srv/http/app/coverart_ctl.php{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

file=/srv/http/app/templates/header.php
echo $file
sed -i -e 's|RuneUIe|RuneAudio - RuneUI|
' -e '/roundslider.min.css\|enhance.css\|id="bartop"\|id="barbottom\|dropdownbg\|button id="menu-settings"\|id="pause"\|Development<.a>/ d
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
sed -i -e '/jquery.knob.min.js/ {s/^<!--//; s/-->$//}
' -e '/roundslider.min.js\|enhance.js/ d
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
' -e '/enhanceplayback.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' $file

file=/srv/http/app/settings_ctl.php
echo $file
sed -i '/if ( \$template->local_browser )/,/^}$/ d' $file

file=/srv/http/assets/js/runeui.js
echo $file
sed -i '/^\/\*enha\|^enha\*\// d' $file

file=/srv/http/assets/js/runeui.min.js
echo $file
sed -i 's|/\*enha ||; s| enha\*/||' $file

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
