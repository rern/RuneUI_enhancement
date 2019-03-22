#!/bin/bash

# $1-zoom
# $2-acc/alac support

# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

#0temp0
# convert redis bkmarks to file based
comment=$( cat <<'EOF' ####################################
dir=/srv/http/assets/img/bookmarks
lines=$( redis-cli hgetall bkmarks )
if [[ ! -e $dir && $lines ]]; then
    mkdir -p $dir
    readarray -t lines <<<"$lines"
    linesL=${#lines[@]}
    for (( i=0; i < $linesL; i+=2 )); do
        mpdpath=${lines[$i+1]}
        oldfile=/mnt/MPD/$mpdpath/thumbnail.jpg
        newfile=$dir/${mpdpath//\//|}^^${lines[$i]}.jpg
        if [[ -e "$oldfile" ]]; then
            cp -f "$oldfile" "$dir/${mpdpath//\//|}.jpg" 2> /dev/null
        else
            touch "$dir/${mpdpath//\//|}^^${lines[$i]}"
        fi
    done
    chown -R http:http $dir
fi
redis-cli del bkmarks &> /dev/null
EOF
)##########################################################
redis-cli hdel display order &> /dev/null
rm -rf /srv/http/assets/img/coverarts/coverarts
redis-cli hdel display library &> /dev/null
#1temp1

installstart $@

if ! pacman -Q imagemagick &> /dev/null; then
	wgetnc https://github.com/rern/RuneAudio/raw/master/coverarts/imagemagick.tar
	bsdtar xf imagemagick.tar -C /
	pacman -S imagemagick libpng zlib glibc
fi

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
file=/srv/http/app/templates/dev.php
echo $file

commentH -n -2 'DevTeam functions' -n -3 'System commands'

commentH -n -1 'Update RuneUI' -n +5 'Update RuneUI'
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

commentH -n -1 'for="localSStime">' -n +5 'for="localSStime">'

commentH -n -1 'for="remoteSStime">' -n +5 'for="remoteSStime">'
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/sources.php
echo $file

commentH -n -1 'music library' -n -1 '<h2>Network mounts'

string=$( cat <<'EOF'
	<legend>Library database</legend>
	<p>Your <a href="/#panel-sx">music library</a> is composed by two main content types: <strong>local sources</strong> and streaming sources.<br>
	This section lets you configure your local sources, telling <a href="http://www.musicpd.org/" title="Music Player Daemon" rel="nofollow" target="_blank">MPD</a> to scan the contents of <strong>network mounts</strong> and <strong>USB mounts</strong>.</p>
	<button class="btn btn-lg btn-primary" id="update"><i class="fa fa-refresh sx"></i>Update</button>
	<button class="btn btn-lg btn-primary" id="rescan"><i class="fa fa-refresh sx"></i>Rescan</button>
	<button class="btn btn-default btn-lg" id="updating"><i class="fa fa-library bl"></i>&emsp;Library updating...</button>
	<span class="help-block">Update: Only changed data and files &emsp; Rescan: All data and files</span>
EOF
)
insertH '<h2>Network mounts'
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
	# set AAC/ALAC support
	[[ $2 ]] && redis-cli hset mpdconf ffmpeg $2 &> /dev/null
else
	zoom=$( redis-cli get zoomlevel )
fi

#----------------------------------------------------------------------------------
file=/root/.config/midori/config
if [[ -e $file ]] && ! grep '^chromium' $file &> /dev/null; then
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
	file=/etc/X11/xinit/start_chromium.sh
	[[ ! -e $file ]] && file=/root/.xinitrc
	
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
# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

playback="bars debug dev time cover volume buttons"
library="order coverart nas sd usb webradio album artist albumartist composer genre dirble jamendo"
miscel="count label coverfile plclear playbackswitch tapaddplay"
for item in $playback $library $miscel; do
	if [[ $( redis-cli hexists display $item ) == 0 ]]; then
		echo order jamendo debug dev tapaddplay | grep -qw $item && chk='' || chk=checked
		redis-cli hset display $item "$chk" &> /dev/null
	fi
done
# pre-count albumartist, composer, genre
albumartist=$( mpc list albumartist | awk NF | wc -l )
composer=$( mpc list composer | awk NF | wc -l )
genre=$( mpc list genre | awk NF | wc -l )
redis-cli set mpddb "$albumartist $composer $genre" &> /dev/null

# fix webradio permission
chown -R http:http /mnt/MPD/Webradio

# disable USB drive auto scan database ..."
redis-cli set usb_db_autorebuild 0 &> /dev/null
# disable GB and DE locale ..."
sed -i '/^de_DE.UTF-8\|^en_GB.UTF-8/ s/^/#/' /etc/locale.gen
# disable default shutdown
systemctl disable rune_shutdown
#systemctl stop rune_shutdown

installfinish $@

restartlocalbrowser

reinitsystem
