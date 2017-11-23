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
rm -v $path/css/custom*.css
rm -v $path/img/runelogo.svg
rm -v $path/js/{custom.js,vendor/propagating.js}
rm $path/js/vendor/jquery-ui.min.js &> /dev/null

mv /srv/http/app/coverart_ctl.php{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."
header=/srv/http/app/templates/header.php
echo $header
sed -i -e '/custom.css/, /<!-- enhancement -->/ d
' -e '/barleft/, /barright/ d
' -e '/runelogo.svg/ d
' -e '/dropdownbg/ d
' -e 's/<button id="menu-settings" class="btn-default dropdown-toggle"/<a id="menu-settings" class="dropdown-toggle"/
' -e 's|href="#"><i class="fa fa-gear"></i></button>|href="#">MENU <i class="fa fa-bars dx"></i></a>|
' -e '\|href="/"><i class="fa fa-play"| s|^<?php /\*||; \|href="/"><i class="fa fa-play"| s|\*/?>$||
' -e '\|"fa fa-code"></i> Development</a>| d
' -e '\|REQUEST_URI| d
' -e 's|<?=$path;?>|/#playback|
' -e '/logo.png/ s|^<?php /\*||; /logo.png/ s|\*/?>$||
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
sed -i -e '/playbackcustom.php/, /\/\*/ d
' -e '/enh \*\/?>/ d
' $playback

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
