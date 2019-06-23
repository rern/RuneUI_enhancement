#!/bin/bash

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

uninstallstart $@

# remove files #######################################
echo -e "$bar Remove files ..."

rm -v /srv/http/enhance*
rm -v /srv/http/app/templates/enhance*
rm -v /srv/http/assets/css/{enhance*,fontawesome.min,roundslider.min,toggle-switch.min}.css
rm -v /srv/http/assets/fonts/enhance*
rm -v /srv/http/assets/img/{bootsplash.png,controls*,cover.svg,vu*}
rm -v /srv/http/assets/js/enhance*
rm -v /srv/http/assets/js/vendor/{lazyload,roundslider}.min.js
rm -v /srv/http/assets/js/vendor/pica.js

# DO NOT remove - used by other addons
# bootstrap.min.css, bootstrap-select.min.css

mv -f /srv/http/index.php{.backup,}
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
/srv/http/app/templates/network_edit.php
/srv/http/app/templates/settings.php
/srv/http/app/templates/sources.php
/srv/http/app/templates/sources_edit.php
/srv/http/command/rune_PL_wrk
"
[[ ! -e /etc/X11/xinit/start_chromium.sh ]] && files="$files\
/root/.config/midori/config
/root/.xinitrc
"
restorefile $files

# back button to left
rm -f /usr/local/bin/uninstall_bbtn.sh
redis-cli del bbtn &> /dev/null

if [[ $1 == u ]]; then
	systemctl restart rune_PL_wrk
	uninstallfinish $@
	restartlocalbrowser
	reinitsystem
	exit
fi

########## if not update ############################################################
# set color to default
setColor 1

# convert playlists back to default (omit cue)
dir=/srv/http/assets/img/playlists
if [[ -n $( ls -A $dir ) ]]; then
	echo -e "$bar Convert playlists data ..."
	
	plfiles=( $dir/* )
	for plfile in "${plfiles[@]}"; do
		lines=
		readarray lists < "$plfile"
		for list in "${lists[@]}"; do
			data=${list//^^/^}
			[[ -z $( echo $data | cut -d'^' -f10 ) ]] && lines="$lines${data%%^*}\n"
		done
		name=$( basename $plfile )
		echo $name
		printf "$lines" > "/var/lib/mpd/playlists/$name.m3u"
	done
fi

# convert file based webradios back to redis
dir=/srv/http/assets/img/webradios
if [[ ! -z $( ls -A $dir 2> /dev/null ) ]]; then
	echo -e "$bar Convert Webradios data ..."
	files=( $dir/* )
	for file in ${files[@]}; do
		url=$( basename "$file" )
		url=${url//|/\/}
		name=$( head -n1 $file )
		cat << EOF > "/mnt/MPD/Webradio/$name.pls"
[playlist]
NumberOfEntries=1
File1=$url
Title1=$name
EOF
		echo $name - $url
		redis-cli hset webradios "$name" "$url" &> /dev/null
	done
	mpc update Webradio &> /dev/null
fi

# convert file based bookmarks back to redis
dir=/srv/http/assets/img/bookmarks
if [[ ! -z $( ls -A $dir 2> /dev/null ) ]]; then
	echo -e "$bar Convert bookmarks data ..."
	files=( $dir/* )
	idx=0
	for file in "${files[@]}"; do
		path=$( basename "$file" )
		path=${path//|/\/}
		name=$( basename "$path" )
		(( idx++ ))
		redis-cli hset bookmarks $idx "{\"name\":\"$name\",\"path\":\"$path\"}" &> /dev/null
		echo $path
	done
	redis-cli set bookmarksidx $idx &> /dev/null
fi

redis-cli del sampling mpddb &> /dev/null

rm -rf "$( readlink -f /srv/http/assets/img/tmp )"
rm -rf "$( readlink -f /srv/http/assets/img/webradiopl )"
rm -rf /srv/http/assets/img/{bookmarks,coverarts,playlists,webradios,webradiopl}

systemctl enable rune_shutdown
systemctl start rune_shutdown
systemctl restart rune_PL_wrk

uninstallfinish $@

restartlocalbrowser

reinitsystem
