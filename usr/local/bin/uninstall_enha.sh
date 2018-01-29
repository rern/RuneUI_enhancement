#!/bin/bash

alias=enha

. /srv/http/addonstitle.sh

uninstallstart $@

if [[ $1 == u ]]; then
	zoom=$( grep '^zoom' /root/.config/midori/config | cut -d '=' -f 2 )
	redis-cli set enhazoom $zoom &> /dev/null
else
	redis-cli del display &> /dev/null
fi

# remove files #######################################
echo -e "$bar Remove files ..."
rm -v /srv/http/app/templates/playbackcustom.php
rm -v /srv/http/{displayget.php,displaysave.php}
path=/srv/http/assets
rm -v $path/css/custom.css
rm -v $path/img/runelogo.svg
rm -vf $path/js/{custom.js,vendor/jquery-ui.min.js,vendor/propagating.js}

mv /srv/http/app/coverart_ctl.php{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

file=/srv/http/app/playback_ctl.php
echo $file
sed -i '/template->local_browser/ d' $file

file=/srv/http/app/templates/header.php
echo $file
sed -i -e 's|RuneUIe|RuneAudio - RuneUI|
' -e '\|custom.css| d
' -e '\|dropdownbg| d
' -e 's|<button\( id="menu-settings" class="\)btn-default \(dropdown-toggle"\)|<a\1\2|
' -e 's|\(href="#">\)\(<i class="fa fa-\)gear"></i></button>|\1MENU\2bars dx"></i></a>|
' -e '\|href="/"><i class="fa fa-play"| {s|^<?php /\*||; s|\*/?>$||}
' -e '\|"fa fa-code"></i> Development</a>| d
' -e '\|href="http://www.runeaudio.com|, \|</a>| d
' -e '\|logo.png| {s|^<?php /\*||; s|\*/?>$||}
' -e 's|id="open-panel-sx"><a |&href="/#panel-sx"|
' -e 's|id="open-playback".*><a |&href="/#playback"|
' -e 's|id="open-panel-dx"><a |&href="/#panel-dx"|
' -e 's|\("tab".*"fa fa-\)folder-open"></i></a>|\1music"></i> Library</a>|
' -e 's|\("tab".*"fa fa-play\)-circle"></i>|\1"></i> Playback|
' -e 's|\("tab".*"fa fa-list"></i>\)</a>|\1 Queue</a>|
' $file

file=/srv/http/app/templates/footer.php
echo $file
sed -i -e '/custom.js/ d
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
' -e '/playbackcustom.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' $file

file=/srv/http/app/settings_ctl.php
echo $file
sed -i '/if ( \$template->local_browser )/,/^}$/ d' $file

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
