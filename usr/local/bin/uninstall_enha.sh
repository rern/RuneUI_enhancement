#!/bin/bash

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

uninstallstart $@

if [[ $1 == u ]]; then
	zoom=$( redis-cli get zoomlevel )
	if [[ -z $zoom ]]; then
		if ! pacman -Q chromium &> /dev/null; then
			zoom=$( grep '^zoom' /root/.config/midori/config | cut -d'=' -f2 )
		else
			zoom=$( grep '^force-device-scale-factor' /root/.xinitrc | cut -d'=' -f2 )
		fi
	fi
else
	redis-cli del display webradiosampling zoomlevel &> /dev/null
fi

# remove files #######################################
echo -e "$bar Remove files ..."

rm -v /srv/http/enhance*
rm -v /srv/http/app/templates/{footer,header,playback}.php
rm -v /srv/http/assets/css/{enhance,midori,roundslider.min}.css
rm -v /srv/http/assets/fonts/enhance*
rm -v /srv/http/assets/img/{controls*,runelogo.svg,vu*}
rm -v /srv/http/assets/js/{enhance,runeui,runeui.min}.js
rm -v /srv/http/assets/js/vendor/{jquery-ui.min,modernizr-custom,roundslider.min}.js
rm /usr/share/bootsplash/{start,reboot,shutdown}-runeaudio.png

mv /srv/http/app/coverart_ctl.php{.backup,}
mv /srv/http/app/templates/footer.php{.backup,}
mv /srv/http/app/templates/header.php{.backup,}
mv /srv/http/app/templates/playback.php{.backup,}
mv /srv/http/assets/js/runeui.js{.backup,}
mv /srv/http/assets/js/runeui.min.js{.backup,}
mv /srv/http/command/airplay_toggle{.backup,}
mv /usr/share/bootsplash/start-runeaudio.png{.backup,}
mv /usr/share/bootsplash/reboot-runeaudio.png{.backup,}
mv /usr/share/bootsplash/shutdown-runeaudio.png{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

files="
/srv/http/app/templates/header.php
/srv/http/app/templates/footer.php
/srv/http/app/templates/settings.php
/srv/http/db/index.php
/srv/http/app/libs/runeaudio.php
/srv/http/app/settings_ctl.php
/root/.config/midori/config
/root/.xinitrc
"
restorefile $files

uninstallfinish $@

[[ $1 != u ]] && clearcache
