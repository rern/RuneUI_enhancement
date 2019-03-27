#!/bin/bash

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

uninstallstart $@

# remove files #######################################
echo -e "$bar Remove files ..."

rm -v /srv/http/enhance*
rm -v /srv/http/app/templates/enhance*
rm -v /srv/http/assets/css/{enhance*,fontawesome.min,pnotify.custom.min,roundslider.min,toggle-switch.min}.css
rm -v /srv/http/assets/fonts/enhance*
rm -v /srv/http/assets/img/{bootsplash.png,controls*,cover.svg,runelogo.svg,vu*}
rm -v /srv/http/assets/js/enhance*
rm -v /srv/http/assets/js/vendor/{lazyload,pica,roundslider}.min.js
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
/srv/http/app/templates/dev.php
/srv/http/app/templates/mpd.php
/srv/http/app/templates/settings.php
/srv/http/app/templates/sources.php
/srv/http/command/rune_PL_wrk
"
[[ ! -e /etc/X11/xinit/start_chromium.sh ]] && files="$files\
/root/.config/midori/config
/root/.xinitrc
"
restorefile $files

# convert file based webradios back to redis
files=( /srv/http/assets/img/webradios/* )
for file in ${files[@]}; do
	url=$( basename $file )
	url=${url//|/\/}
	name=$( head -n1 $file )
	string=$( cat <<EOF
[playlist]
NumberOfEntries=1
File1=$url
Title1=$name
EOF
)
	echo "$string" > "/mnt/MPD/Webradio/$name.pls"
done

mpc update Webradio &> /dev/null

# convert file based bookmarks back to redis
idx=$( redis-cli get bookmarksidx )
files=( /srv/http/assets/img/bookmarks/* )
for file in "${files[@]}"; do
	path=$( basename $file )
	path=${path//|/\/}
	name=$( cat $file | cut -d'^^' -f1 )
	(( idx++ ))
	redis-cli hset bookmarks $idx "{\"name\":\"$name\",\"path\":\"$path\"}" &> /dev/null
done

systemctl restart rune_PL_wrk
if [[ $1 != u ]]; then
	redis-cli del display sampling mpddb &> /dev/null
	systemctl enable rune_shutdown
	systemctl start rune_shutdown
fi

chown -R mpd:audio /mnt/MPD/Webradio

uninstallfinish $@

restartlocalbrowser

reinitsystem
