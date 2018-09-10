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
redis-cli del volumemute &> /dev/null
#1temp1

mv /srv/http/index.php{,.backup}
mv /srv/http/assets/js/vendor/pnotify.custom.min.js{,.backup}
mv /srv/http/assets/js/vendor/pushstream.min.js{,.backup}
mv /srv/http/assets/js/vendor/Sortable.min.js{,.backup}
mv /srv/http/command/airplay_toggle{,.backup}
ln -sf /usr/share/bootsplash/start.png /srv/http/assets/img/bootsplash.png

getinstallzip

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
                ui_render( 'playlist', json_encode( $info ) );
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
file=/srv/http/command/rune_SY_wrk
echo $file

comment 'is-enabled rune_PL_wrk.service' 'enable rune_PL_wrk.service'

systemctl stop rune_PL_wrk
systemctl disable rune_PL_wrk
#----------------------------------------------------------------------------------
file=/srv/http/app/templates/dev.php
echo $file

commentH -n -1 'RuneAudio PLAYBACK Worker' -n +3 'Restart rune_PL_wrk'
#----------------------------------------------------------------------------------
file=/srv/http/command/orion_optimize.sh
echo $file

commentS 'rune_PL_wrk'
#----------------------------------------------------------------------------------
file=/srv/http/db/redis_datastore_setup
echo $file

comment 'rune_PL_wrk'
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
# disable default shutdown
systemctl disable rune_shutdown

# correct version number
[[ $( redis-cli get buildversion ) == 'beta-20160313' ]] && redis-cli set release 0.3 &> /dev/null

installfinish $@

# set library home database
[[ $( redis-cli get volume ) == 1 ]] && volumempd=1 || volumempd=''

if [[ $1 != u ]]; then
	redis-cli hmset display bars checked time checked coverart checked volume checked buttons checked radioelapsed 0 volumempd $volumempd volumemute 0\
	\nas checked sd checked usb checked webradio checked albums checked artists checked composer checked genre checked \
	\spotify checked dirble checked jamendo checked &> /dev/null
fi

reinitsystem
