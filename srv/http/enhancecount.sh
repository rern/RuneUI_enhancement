#!/bin/bash

if (( $# > 0 )); then
	[[ $1 == update || $1 == rescan ]] && { sleep 0.05; echo $1; sleep 0.05; } | telnet localhost 6600
	albumartist=$( mpc list albumartist | awk NF | wc -l )
	composer=$( mpc list composer | awk NF | wc -l )
	genre=$( mpc list genre | awk NF | wc -l )
	count="$albumartist $composer $genre"
	redis-cli set mpddb "$count"
	[[ $( redis-cli hget display count ) == 'checked' ]] && curl -s -v -X POST 'http://localhost/pub?id=count' -d "\"$count\""
	exit
fi

# artist album song composer genre nas usb webradio sd
count="$count $( mpc stats | head -n3 | awk '{print $2,$4,$6}' )"
artist=$( echo $count | cut -d' ' -f1 )
album=$( echo $count | cut -d' ' -f2 )
song=$( echo $count | cut -d' ' -f3 )
countalbum=$( redis-cli get countalbum )
[[ $countalbum ]] && album=$countalbum
mpddb=$( redis-cli get mpddb )
nas=$( mount | grep -qc '/mnt/MPD/NAS' )
usb=$( mount | grep -qc '/mnt/MPD/USB' )
webradio=$( ls -U /srv/http/assets/img/webradios/* 2> /dev/null | wc -l )
sd=$( mpc listall LocalStorage 2> /dev/null | wc -l )

echo $artist $album $song $mpddb $nas $usb $webradio $sd
