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

rm -v /srv/http/index.php
rm -v /srv/http/enhance*
rm -v /srv/http/app/enhance*
rm -v /srv/http/app/templates/enhance*
rm -v /srv/http/assets/fonts/enhance*
rm -v /srv/http/assets/css/{bootstrap.min,enhance,fontawesome.min,midori,pnotify.custom.min,roundslider.min,settings,toggle-switch.min}.css
rm -v /srv/http/assets/img/{bootsplash.png,controls*,runelogo.svg,vu*}
rm -v /srv/http/assets/js/{enhance,settings}.js
rm -v /srv/http/assets/js/vendor/{jquery-ui.min,modernizr-custom,pnotify.custom.min,roundslider.min}.js

mv /srv/http/index.php{.backup,}
mv /srv/http/assets/js/vendor/pnotify.custom.min.js{.backup,}
mv /srv/http/assets/js/vendor/pushstream.min.js{.backup,}
mv /srv/http/assets/js/vendor/Sortable.min.js{.backup,}
mv /srv/http/command/airplay_toggle{.backup,}
ln -sf /usr/share/bootsplash/start.png /usr/share/bootsplash/start-runeaudio.png

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

files="
/srv/http/app/templates/mpd.php
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
systemctl restart rune_PL_wrk
