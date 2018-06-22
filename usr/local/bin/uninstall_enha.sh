#!/bin/bash

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

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
rm -v /srv/http/assets/css/{enhance.css,midori.css,roundslider.min.css}
rm -v /srv/http/assets/img/{controls.svg,runelogo.svg}
rm -v /srv/http/assets/js/enhance.js
rm -v /srv/http/assets/js/vendor/{jquery-ui.min.js,roundslider.min.js}
rm /usr/share/bootsplash/{start,reboot,shutdown}-runeaudio.png

mv /srv/http/assets/js/runeui.min.js{.backup,}
mv /srv/http/app/coverart_ctl.php{.backup,}
mv /usr/share/bootsplash/start-runeaudio.png{.backup,}
mv /usr/share/bootsplash/reboot-runeaudio.png{.backup,}
mv /usr/share/bootsplash/shutdown-runeaudio.png{.backup,}

# restore modified files #######################################
echo -e "$bar Restore modified files ..."
files="
/srv/http/app/templates/header.php
/srv/http/app/templates/footer.php
/srv/http/app/templates/playback.php
/srv/http/app/settings_ctl.php
/srv/http/assets/js/runeui.js
/srv/http/app/libs/runeaudio.php
/srv/http/db/index.php
/root/.config/midori/config
"
restorefile $file

uninstallfinish $@

[[ $1 != u ]] && clearcache
