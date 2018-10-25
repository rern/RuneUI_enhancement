#!/bin/bash

# $1-zoom
# $2-local browser

# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

installstart $@

#0temp0 remove uninstall leftover
redis-cli del volumemute &> /dev/null
redis-cli hdel display albums artists &> /dev/null
sed -i '/^disable_overscan=1\|^hdmi_ignore_cec=1/ d' /boot/config.txt
rm -f /srv/http/app/enhancecoverart_ctl.php
#1temp1

mv /srv/http/index.php{,.backup}
mv /srv/http/assets/js/vendor/pnotify.custom.min.js{,.backup}
mv /srv/http/assets/js/vendor/pushstream.min.js{,.backup}
mv /srv/http/assets/js/vendor/Sortable.min.js{,.backup}
mv /srv/http/command/airplay_toggle{,.backup}
ln -sf /srv/http/assets/img/bootsplash.png /usr/share/bootsplash/start.png

getinstallzip

echo -e "$bar Modify files ..."
#----------------------------------------------------------------------------------
file=/srv/http/app/libs/runeaudio.php
echo $file

comment -n +2 'ui_update('

string=$( cat <<'EOF'
        $status[ 'changed' ] = explode( "\n", $change[ 1 ] )[ 0 ];
EOF
)
append 'status..changed'
#----------------------------------------------------------------------------------
file=/srv/http/command/rune_PL_wrk
echo $file

comment 'ui_update('

string=$( cat <<'EOF'
                    ui_render( 'idle', json_encode( $status[ 'changed' ] ) );
EOF
)
append 'monitorMpdState'

systemctl restart rune_PL_wrk
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/mpd.php
echo $file

commentH -n -1 'for="realtime-volume"' -n +2 '<strong>on release'
#----------------------------------------------------------------------------------
file=/srv/http/app/settings_ctl.php
echo $file

string=$( cat <<'EOF'
if ( $template->local_browser ) {
    exec( '/usr/bin/sudo /usr/bin/xinit &> /dev/null &' );
} else {
    exec( '/usr/bin/sudo /usr/bin/killall Xorg' );
}
EOF
)
append '$'
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/settings.php
echo $file

commentH -n -1 'for="localSStime">' -n -2 'USB Automount'
#----------------------------------------------------------------------------------
if [[ $1 != u ]]; then # keep range: 0.5 - 3.0
	z=$1;
	zoom=$( echo "0.5 $z 3" \
      | awk '{
          if (( $1 < $2 && $2 < $3 ))
            print $2
          else if (( $2 < $1 ))
            print $1
          else
            print $3
        }'
	)
	redis-cli set zoomlevel $zoom &> /dev/null
else
	zoom=$( redis-cli get zoomlevel )
fi

#----------------------------------------------------------------------------------
file=/root/.config/midori/config
if ! grep '^chromium' $file &> /dev/null; then
	echo $file
	
	commentS 'zoom-level'
	commentS 'user-stylesheet-uri'
	
	string=$( cat <<EOF
zoom-level=$zoom
EOF
)
	appendS 'settings'
else
#----------------------------------------------------------------------------------
	file=/root/.xinitrc
	echo $file
	
	sed -i "s/\(force-device-scale-factor=\).*/\1$zoom/" $file
fi
#----------------------------------------------------------------------------------
file=/boot/config.txt
echo $file

string=$( cat <<EOF
disable_overscan=1
hdmi_ignore_cec=1
EOF
)
appendS '$'
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/enhanceplayback.php  # for rune youtube
[[ -e /usr/local/bin/uninstall_RuneYoutube.sh ]] && sed -i '/id="pl-import-youtube"/ {s/<!--//; s/-->//}' $file
#----------------------------------------------------------------------------------
# disable default shutdown
systemctl disable rune_shutdown

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

# convert bookmarks
bkmarks=$( redis-cli keys bkmarks )
if [[ ! $bkmarks ]]; then
	bookmarks=$( redis-cli hgetall bookmarks | tr -d '"{}\\' )
	readarray -t bookmarks <<<"$bookmarks"
	ilength=${#bookmarks[*]}
	for (( i=0; i < ilength; i++ )); do
		if (( i % 2 )); then
			kv=${bookmarks[ $i ]}
			k=$( echo $kv | cut -d',' -f1 )
			v=$( echo $kv | cut -d',' -f2 )
			redis-cli hset bkmarks "${k/name:}" "${v/path:}" &> /dev/null
		fi
	done
fi

for item in bars debug dev time coverart volume buttons nas sd usb webradio album artist albumartist composer genre dirble jamendo count label; do
	[[ $( redis-cli hexists display $item ) == 0 ]] && redis-cli hset display $item checked &> /dev/null
done
# fix webradio permission
chown -R http:http /mnt/MPD/Webradio

installfinish $@

restartlocalbrowser

reinitsystem
