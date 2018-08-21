#!/bin/bash

# $1-zoom
# $2-local browser

# change version number in RuneAudio_Addons/srv/http/addonslist.php

alias=enha

. /srv/http/addonstitle.sh
. /srv/http/addonsedit.sh

installstart $@

#0temp0 remove uninstall leftover
sed -i 's/gifico|svg/gif|ico/' /etc/nginx/nginx.conf
rm -f /srv/http/assets/js/vendor/{hammer.min.js,propagating.js}
sed -i '/hammer.min.js\|propagating.js/ d' /srv/http/app/templates/footer.php
#1temp1

mv /srv/http/app/coverart_ctl.php{,.backup}
mv /srv/http/app/templates/footer.php{,.backup}
mv /srv/http/app/templates/header.php{,.backup}
mv /srv/http/app/templates/playback.php{,.backup}
mv /srv/http/assets/js/vendor/Sortable.min.js{,.backup}
mv /srv/http/command/airplay_toggle{,.backup}
mv /usr/share/bootsplash/start-runeaudio.png{,.backup}
mv /usr/share/bootsplash/reboot-runeaudio.png{,.backup}
mv /usr/share/bootsplash/shutdown-runeaudio.png{,.backup}

getinstallzip

ln -s /usr/share/bootsplash/{start,reboot}-runeaudio.png
ln -s /usr/share/bootsplash/{start,shutdown}-runeaudio.png

echo -e "$bar Modify files ..."
#----------------------------------------------------------------------------------
file=/srv/http/db/index.php
echo $file
comment 'echo getPlayQueue($mpd)'

string=$( cat <<'EOF'
                $playlist = getPlayQueue( $mpd );
                if ( preg_match( '/file: http/', $playlist ) ) {
                    $redis = new Redis();
                    $redis->pconnect( '127.0.0.1' );
                }
                $line = strtok( $playlist."\nfile", "\n" );
                while ( $line !== false ) {
                    if ( strpos( $line, 'file' ) === 0 && $data ) {
                        $file = $data[ 'file' ];
                        if ( substr( $file, 0, 4 ) === 'http' ) {
                            $webradios = $redis->hGetAll( 'webradios' );
                            $webradioname = array_flip( $webradios );
                            $data[ 'Title' ] = $webradioname[ $file ];
                        }
                        $pathinfo = pathinfo( $file );
                        if ( !isset( $data[ 'Artist' ] ) ) $data[ 'Artist' ] = basename( $pathinfo[ 'dirname' ] );
                        if ( !isset( $data[ 'Title' ] ) ) $data[ 'Title' ] = $pathinfo[ 'filename' ];
                        if ( !isset( $data[ 'Album' ] ) ) $data[ 'Album' ] = '';
                        $info[] = $data;
                        $data = NULL;
                    }
                    $kv = explode( ': ', $line, 2 );
                    if ( $kv[ 0 ] !== 'OK' && $kv[ 0 ] ) $data[ $kv[ 0 ] ] = $kv[ 1 ];
                    $line = strtok( "\n" );
                }
                echo json_encode( $info );
EOF
)
append 'echo getPlayQueue($mpd)'
#----------------------------------------------------------------------------------
file=/srv/http/app/libs/runeaudio.php
echo $file

string=$( cat <<'EOF'
        if ( preg_match( '/playlist: Webradio/', $plistLine ) ) {
            $redis = new Redis();
            $redis->pconnect( '127.0.0.1' );
        }
EOF
)
append 'browseMode = TRUE'

comment 'parseFileStr($value'

string=$( cat <<'EOF'
                $pathinfo = pathinfo( $value );
                $plistArray[ $plCounter ][ 'fileext' ] = $pathinfo[ 'extension' ];
                if ( preg_match( '/^Webradio/', $value ) ) {
                    $webradiourl = $redis->hGet( 'webradios', $pathinfo[ 'filename' ] );
                    $plistArray[ $plCounter ][ 'url' ] = $webradiourl;
                }
EOF
)
append 'parseFileStr($value'

string=$( cat <<'EOF'
            $redis->hDel('sampling', $label);
EOF
)
append 'hDel(.webradios., $label)'

string=$( cat <<'EOF'
                        $redis->hSet( 'display', 'volumempd', 1);
EOF
)
append "set('volume', 1)"

string=$( cat <<'EOF'
                        $redis->hSet( 'display', 'volumempd', '');
EOF
)
append "set('volume', 0)"
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
echo 'disable_overscan=1
hdmi_ignore_cec=1' >> $file
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/enhanceplayback.php  # for rune youtube
[[ -e /usr/local/bin/uninstall_RuneYoutube.sh ]] && sed -i '/id="pl-import-youtube"/ {s/<!--//; s/-->//}' $file
#----------------------------------------------------------------------------------

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

installfinish $@

# set library home database
if [[ $1 != u ]]; then
	[[ $( redis-cli get volume ) == 1 ]] && volume=1 || volume=''
	
	redis-cli hmset display bars checked pause checked time checked coverart checked volume checked buttons checked \
	\nas checked sd checked usb checked webradio checked albums checked artists checked composer checked genre checked \
	\spotify checked dirble checked jamendo checked volumempd $volume &> /dev/null
	
	reinitsystem
else
	clearcache
fi

# temp for version before 20180822
[[ $( redis-cli get volume ) == 1 ]] && volume=1 || volume=''
redis-cli hset display volumempd $volume

reinitsystem
