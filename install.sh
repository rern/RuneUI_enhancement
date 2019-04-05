#!/bin/bash

# $1-zoom
# $2-acc/alac support

# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

#0temp0
[[ $( redis-cli hget addons enha ) < 20190318 ]] && redis-cli hdel display order &> /dev/null
rm -rf /srv/http/assets/img/coverarts/coverarts
#1temp1

installstart $@

if ! pacman -Q imagemagick &> /dev/null; then
	pacman -Sy imagemagick libpng zlib glibc
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

commentH -n -1 'Display album cover' -n +8 'Display album cover'
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

########## to be moved after 'if not update' ###################################################################
# persistent settings
makeDirLink settings
dirsettings=$( readlink -f /srv/http/assets/img/settings )
direxist=/var/lib/mpd
dirmove="$dirsettings/mpd"
[[ ! -e "$dirmove" ]] && mv "$direxist" "$dirsettings"
rm -rf "$direxist"
ln -sf "$dirmove" /var/lib
chown -R mpd:audio "$dirmove" "$direxist"

direxist=/var/lib/redis
dirmove="$dirsettings/redis"
[[ ! -e "$dirmove" ]] && mv "$direxist" "$dirsettings"
rm -rf "$direxist"
ln -sf "$dirmove" /var/lib
chown -R mpd:audio "$dirmove" "$direxist"

direxist=/etc/netctl
dirmove="$dirsettings/netctl"
[[ ! -e "$dirmove" ]] && mv "$direxist" "$dirsettings"
rm -rf "$direxist"
ln -sf "$dirmove" /etc

file=/etc/mpd.conf
[[ ! -e "$dirsettings/mpd.conf" ]] && mv $file "$dirsettings"
rm -f $file
ln -sf "$dirsettings/mpd.conf" /etc

# dirble temp
dir=/srv/http/assets/img/webradiopl
mkdir -p $dir
chown -R http:http $dir

makeDirLink coverarts

makeDirLink webradios
# convert webradios
# filename: http:||webradio|url
# content:
#	name only  - name
#	with image - name\nbase64thumbnail\nbase64image
dir=/srv/http/assets/img/webradios
if [[ -z $( ls -A $dir ) ]]; then
	webradios=$( redis-cli hgetall webradios )
	if [[ $webradios ]]; then
		echo -e "$bar Convert Webradios data ..."

		readarray -t lines <<<"$webradios"
		linesL=${#lines[@]}
		for (( i=0; i < $linesL; i+=2 )); do
			name=${lines[ $i ]}
			url=${lines[ $i + 1 ]}
			echo $name > "$dir/${url//\//|}"
			echo $name - $url
		done
	fi
	dirtarget=$( readlink -f $dir )
	chown -R http:http "$dirtarget" $dir
fi

makeDirLink bookmarks
# convert old bookmarks
# filename: path|to|bookmark
# content:
#	name  - name
#	image - base64image
dir=/srv/http/assets/img/bookmarks
if [[ -z $( ls -A $dir ) ]]; then
	bookmarks=$( redis-cli hgetall bookmarks | tr -d '"{}\\' )
	if [[ $bookmarks ]]; then
		echo -e "$bar Convert Bookmarks data ..."

		readarray -t lines <<<"$bookmarks"
		linesL=${#lines[@]}
		for (( i=1; i < linesL; i+=2 )); do
			namepath=${lines[ $i ]}
			name=$( echo $namepath | cut -d',' -f1 )
			path=$( echo $namepath | cut -d',' -f2 )
			name=${name/name:}
			path=${path/path:}
			mpdpath=${path//\\/}
			oldfile=/mnt/MPD/$mpdpath/thumbnail.jpg
			newfile="$dir/${mpdpath//\//|}"
			if [[ -e "$oldfile" ]]; then
				base64data=$( base64 -w 0 "$oldfile" )
				echo "data:image/jpeg;base64,$base64data" > "$newfile"
			else
				echo $name > "$newfile"
			fi
			echo $path
		done
		redis-cli del bookmarks bookmarksidx &> /dev/null
	fi
	# convert new bookmarks (to be removed in next version)
	bkmarks=$( redis-cli hgetall bkmarks )
	if [[ $bkmarks ]]; then
		readarray -t lines <<<"$bkmarks"
		linesL=${#lines[@]}
		for (( i=0; i < $linesL; i+=2 )); do
			mpdpath=${lines[$i+1]}
			oldfile=/mnt/MPD/$mpdpath/thumbnail.jpg
			newfile="$dir/${mpdpath//\//|}"
			if [[ -e "$oldfile" ]]; then
				base64data=$( base64 -w 0 "$oldfile" )
				echo "data:image/jpeg;base64,$base64data" > "$newfile"
			else
				echo ${lines[$i]} > "$newfile"
			fi
			echo $mpdpath
		done
		redis-cli del bkmarks &> /dev/null
	fi
	dirtarget=$( readlink -f $dir )
	chown -R http:http "$dirtarget" $dir
fi
##############################################################################################################

if [[ $1 == u ]]; then
	installfinish $@
	restartlocalbrowser
	reinitsystem
	exit
fi

########## if not update ############################################################

# zoom - keep range: 0.5 - 3.0
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
library="coverart nas sd usb webradio album artist albumartist composer genre spotify dirble jamendo"
miscel="count label coverfile plclear playbackswitch tapaddplay thumbbyartist"
for item in $playback $library $miscel; do
	echo debug dev jamendo spotify tapaddplay thumbbyartist | grep -qw $item && chk='' || chk=checked
	redis-cli hset display $item "$chk" &> /dev/null
done
# pre-count albumartist, composer, genre
albumartist=$( mpc list albumartist | awk NF | wc -l )
composer=$( mpc list composer | awk NF | wc -l )
genre=$( mpc list genre | awk NF | wc -l )
redis-cli set mpddb "$albumartist $composer $genre" &> /dev/null
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
