#!/bin/bash

alias=enha

. /srv/http/addonstitle.sh

uninstallstart $@

if [[ $1 == u ]]; then
	if ! pacman -Qi chromium &> /dev/null; then
		zoom=$( grep '^zoom' /root/.config/midori/config | cut -d '=' -f 2 )
	else
		zoom=$( grep '^force-device-scale-factor' /root/.xinitrc | cut -d '=' -f 2 )
	fi
	redis-cli set enhazoom $zoom &> /dev/null
else
	redis-cli del display &> /dev/null
fi

# remove files #######################################
echo -e "$bar Remove files ..."
rm -v /srv/http/app/templates/playbackcustom.php
rm -v /srv/http/{displayget.php,displaysave.php}
path=/srv/http/assets
rm -v $path/css/custom*.css
rm -v $path/img/runelogo.svg
rm -vf $path/js/{custom.js,vendor/jquery-ui.min.js,vendor/propagating.js}

mv /srv/http/app/coverart_ctl.php{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

file=/srv/http/app/playback_ctl.php
echo $file
sed -i '/template->local_browser/ d' $file

header=/srv/http/app/templates/header.php
echo $header
sed -i -e 's/RuneUIe/RuneAudio - RuneUI/
' -e '/custom.css/ d
' -e '/runelogo.svg/ d
' -e '/dropdownbg/ d
' -e 's/<button id="menu-settings" class="btn-default dropdown-toggle"/<a id="menu-settings" class="dropdown-toggle"/
' -e 's|href="#"><i class="fa fa-gear"></i></button>|href="#">MENU <i class="fa fa-bars dx"></i></a>|
' -e '\|href="/"><i class="fa fa-play"| s|^<?php /\*||; s|\*/?>$||
' -e '\|href="http://www.runeaudio.com|, \|</a>| d
' -e '/logo.png/ s|^<?php /\*||; s|\*/?>$||
' -e '\|"fa fa-code"></i> Development</a>| d
' -e 's|id="open-panel-sx"><a |& href="/#panel-sx"|
' -e 's|id="open-playback".*><a |& href="/#playback"|
' -e 's|id="open-panel-dx"><a |& href="/#panel-dx"|
' -e $'s|"tab"\')?>><i class="fa fa-folder-open"></i></a>|"tab"\')?>><i class="fa fa-music"></i> Library</a>|
' -e $'s|"tab"\')?>><i class="fa fa-play-circle"></i>|"tab"\')?>><i class="fa fa-play"></i> Playback|
' -e 's|"fa fa-list"></i></a>|"fa fa-list"></i> Queue</a>|
' $header

footer=/srv/http/app/templates/footer.php
echo $footer
sed -i -e '/custom.js/ d
' -e '/propagating.js/ d
' $footer
# 0.4b
if grep -q 'jquery-ui.js' $footer; then
	sed -i -e '/jquery-ui.js/ {s/^<!--//; s/-->$//}
	' -e '/jquery-ui.min.js/ d
	' $footer
fi

# no Addons Menu
if [[ ! -e /usr/local/bin/uninstall_addo.sh ]]; then
	rm $path/js/vendor/hammer.min.js
	sed -i '/hammer.min.js/ d' $footer
fi

playback=/srv/http/app/templates/playback.php
echo $playback
sed -i -e '/^<?php$/,/^?>$/ d
' -e '/playbackcustom.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' $playback

settings=/srv/http/app/settings_ctl.php
echo $settings
sed -i '/if ( \$template->local_browser )/,/^}$/ d' $settings

midori=/root/.config/midori/config
echo $midori
if grep -q '^#zoom-level' $midori; then
	sed -i -e '/^zoom-level/ d
	' -e '/#zoom-level/ s/^#//
	' $midori
fi
sed -i '/#user-stylesheet-uri/ s/^#//' $midori

uninstallfinish $@

[[ $1 != u ]] && clearcache
