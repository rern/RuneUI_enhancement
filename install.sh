#!/bin/bash

# $1-zoom
# $2-acc/alac support
# $3-access point
# $4-local browser
# $5-airplay
# $6-dlna

# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

installstart $@

if ! pacman -Q imagemagick &> /dev/null; then
	echo -e "$bar Get ImageMagick package files ..."
	
	wgetnc https://github.com/rern/_assets/raw/master/imagemagick.tar
	mkdir pkg
	bsdtar xvf imagemagick.tar -C pkg
	# disable GB and DE locale before upgrade glibc
	sed -i '/^de_DE.UTF-8\|^en_GB.UTF-8/ s/^/#/' /etc/locale.gen
	
	echo -e "$bar Install ImageMagick ..."
	
	pacman -U --noconfirm pkg/*

	rm -rf imagemagick.tar pkg
fi
fi [[ ! -e /usr/bin/kid3-cli ]]; then
	echo -e "$bar Get package files ..."

	wgetnc https://github.com/rern/_assets/raw/master/kid3lib.tar.xz
	cp /usr/lib/libcrypto.so.1.1{,backup} &> /dev/null
	cp /usr/lib/libssl.so.1.1{,backup} &> /dev/null
	bsdtar xvf kid3lib.tar.xz -C /usr/lib
	ln -sf /usr/lib/libreadline.so.8{.0,}
	ln -f /usr/lib/libicudata.so.64{.2,}
	ln -f /usr/lib/libicui18n.so.64{.2,}
	ln -f /usr/lib/libicuio.so.64{.2,}
	ln -f /usr/lib/libicuuc.so.64{.2,}

	wgetnc https://github.com/rern/_assets/raw/master/kid3pkg1.tar
	wgetnc https://github.com/rern/_assets/raw/master/kid3pkg2.tar
	mkdir pkg pkg4 pkg5
	bsdtar xvf kid3pkg1.tar -C pkg
	bsdtar xvf kid3pkg2.tar -C pkg
	mv pkg/{pcre*,harfbuzz*,freetype2*} pkg4
	mv pkg/{gstreamer*,orc*} pkg5

	if [[ $( redis-cli get release ) == 0.4b ]]; then
		pacman -U --noconfirm pkg4/*
	else
		pacman -U --noconfirm pkg5/*
	fi
	pacman -U --noconfirm pkg/*

	rm -rf kid3* pkg*
fi

mv /srv/http/index.php{,.backup}
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

if [[ $( redis-cli get buildversion ) > 20170229 ]]; then
	commentH -n -2 'PlayerID' -n +6 'Check FS permissions'
	commentH -n -2 'Player name in Menu' -n +11 'Player name in Menu'
	commentH -n -2 'Update RuneUI' -n +8 'Update RuneUI'
else
	commentH -n -2 'DevTeam functions' -n -3 'System commands'
	commentH -n -1 'Update RuneUI' -n +5 'Update RuneUI'
fi

string=$( cat <<'EOF'
<?php $this->dev = '1';?>
EOF
)
insertH '1'
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
file=/srv/http/app/templates/sources_edit.php
echo $file

string=$( cat <<'EOF'
<?php include( '/app/libs/runeaudio.php' );?>
EOF
)
insertH '1'

# to be moved after 'if not update ##############################################
makeDirLink playlists
# convert playlists
dir=/srv/http/assets/img/playlists
olddir=/var/lib/mpd/playlists
if [[ -z $( ls -A $dir ) && -n $( ls -A $olddir ) ]]; then # convert if none found
    echo -e "$bar Convert playlists data ..."
    
    plfiles=( $olddir/* )
    for plfile in "${plfiles[@]}"; do
        lines=
        readarray files < "$plfile"
        for file in "${files[@]}"; do
            file=$( echo $file | tr -d '\n' )
            if [[ ${file:0:4} == http ]]; then
                lines="$lines$file^^(unnamed)\n"
            else
                data=$( mpc ls -f "%file%^^%title%^^%time%^^[##%track% • ][%artist%][ • %album%]" "$file" )
                lines="$lines$data\n"
            fi
        done
        name=$( basename "$plfile" .m3u )
		echo $name
        printf "$lines" > "$dir/$name"
    done
	setown $dir
fi

############################################################################
if [[ $1 == u ]]; then
	installfinish $@
	restartlocalbrowser
	reinitsystem
	exit
fi

########## if not update ############################################################
makeDirLink coverarts
makeDirLink tmp
makeDirLink webradiopl
makeDirLink webradios

setown() {
	chown -R http:http $1
	[[ -L $1 ]] && chown -R http:http $( readlink -f $1 )
}

# convert webradios
# filename: http:||webradio|url
# content:
#	name only  - name
#	with image - name\nbase64thumbnail\nbase64image (created with RuneUIe only)
dir=/srv/http/assets/img/webradios
olddir=/mnt/MPD/Webradio
if [[ -z $( ls -A $dir ) && -n $( ls -A $olddir ) ]]; then # convert if none found
	echo -e "$bar Convert Webradios data ..."
	
	files=( $olddir/* )
	for file in "${files[@]}"; do
		name=$( grep '^Title' "$file" | cut -d'=' -f2 )
		url=$( grep '^File' "$file" | cut -d'=' -f2 )
		echo $name > "$dir/${url//\//|}"
		echo $name - $url
	done
	setown $dir
fi

makeDirLink bookmarks
# convert old bookmarks
# filename: path|to|bookmark
# content:
#	name  - name
#	image - base64image (created with RuneUIe only)
dir=/srv/http/assets/img/bookmarks
if [[ -z $( ls -A $dir ) ]]; then # convert only when none found
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
	setown $dir
fi

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

[[ $2 == 1 ]] && ffmpeg=yes || ffmpeg=no
redis-cli hset mpdconf ffmpeg $ffmpeg &> /dev/null
redis-cli hset AccessPoint enabled $3 &> /dev/null
redis-cli set local_browser $4 &> /dev/null
redis-cli hset airplay enable $5 &> /dev/null
redis-cli hset dlna enable $6 &> /dev/null
startStop() {
	if [[ -z $2 ]]; then
		systemctl disable $1
		systemctl stop $1
	else
		systemctl enable $1
		systemctl start $1
	fi
}
[[ $3 != 1 ]] && startStop hostapd || startStop hostapd start
[[ $4 != 1 ]] && killall Xorg &> /dev/null
[[ -e /usr/lib/systemd/system/shairport.service ]] && shairport=shairport || shairport=shairport-sync
[[ $5 != 1 ]] && startStop $shairport || startStop $shairport start
[[ $6 != 1 ]] && startStop upmpdcli || startStop upmpdcli start
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

if [[ $( redis-cli hexists display bars ) == 0 ]]; then
	playback="bars debug dev time cover volume buttons"
	library="coverart nas sd usb webradio album artist albumartist composer genre spotify dirble jamendo"
	miscel="count label coverfile plclear playbackswitch tapaddplay thumbbyartist"
	for item in $playback $library $miscel; do
		redis-cli hset display $item checked &> /dev/null
	done
	
	unchecked="debug dev jamendo spotify tapaddplay thumbbyartist"
	for item in $unchecked; do
		redis-cli hset display $item "" &> /dev/null
	done
fi
# pre-count albumartist, composer, genre
albumartist=$( mpc list albumartist | awk NF | wc -l )
composer=$( mpc list composer | awk NF | wc -l )
genre=$( mpc list genre | awk NF | wc -l )
redis-cli set mpddb "$albumartist $composer $genre" &> /dev/null
# disable USB drive auto scan database ..."
redis-cli set usb_db_autorebuild 0 &> /dev/null
# disable default shutdown
systemctl disable rune_shutdown
#systemctl stop rune_shutdown

installfinish $@

restartlocalbrowser

reinitsystem
