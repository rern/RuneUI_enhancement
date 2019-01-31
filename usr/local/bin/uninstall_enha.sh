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
rm -v /srv/http/app/templates/enhance*
rm -v /srv/http/assets/css/{enhance*,fontawesome.min,midori,pnotify.custom.min,roundslider.min,toggle-switch.min}.css
rm -v /srv/http/assets/fonts/enhance*
rm -v /srv/http/assets/img/{bootsplash.png,controls*,cover.svg,runelogo.svg,swipe.svg,vu*}
rm -v /srv/http/assets/js/enhance*
rm -v /srv/http/assets/js/vendor/roundslider.min.js
# DO NOT remove - used by other addons
# bootstrap.min.css, bootstrap-select.min.css

mv -f /srv/http/index.php{.backup,}
mv -f /srv/http/assets/js/vendor/pnotify.custom.min.js{.backup,}
mv -f /srv/http/assets/js/vendor/pushstream.min.js{.backup,}
mv -f /srv/http/assets/js/vendor/Sortable.min.js{.backup,}
mv -f /srv/http/command/airplay_toggle{.backup,}
ln -sf /usr/share/bootsplash/start-runeaudio.png /usr/share/bootsplash/start.png

# restore modified files #######################################
echo -e "$bar Restore modified files ..."

files="
/boot/config.txt
/srv/http/app/settings_ctl.php
/srv/http/app/libs/runeaudio.php
/srv/http/app/templates/mpd.php
/srv/http/app/templates/settings.php
/srv/http/command/rune_PL_wrk
"
[[ ! -e /etc/X11/xinit/start_chromium.sh ]] && files="$files\
/root/.config/midori/config
/root/.xinitrc
"
restorefile $files

systemctl restart rune_PL_wrk

chown -R mpd:audio /mnt/MPD/Webradio

uninstallfinish $@

restartlocalbrowser

reinitsystem
