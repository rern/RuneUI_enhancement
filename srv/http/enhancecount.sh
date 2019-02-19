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

# spotify activePlayer artist album song composer genre nas usb webradio sd
count=
count="$count $( mpc stats | head -n3 | awk '{print $2,$4,$6}' )"
count="$count $( redis-cli get mpddb )"
count="$count $( df | grep '/mnt/MPD/NAS' | wc -l )"
count="$count $( df | grep '/mnt/MPD/USB' | wc -l )"
count="$count $( redis-cli hkeys webradios | sed '/(empty list or set)/ d' | awk NF | wc -l )"
count="$count $( redis-cli hget spotify enable )"
count="$count $( redis-cli get activePlayer )"
echo $count
