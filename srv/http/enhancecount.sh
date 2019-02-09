#!/bin/bash

if (( $# > 0 )); then
	mpc $1
	albumartist=$( mpc list albumartist | awk NF | wc -l )
	composer=$( mpc list composer | awk NF | wc -l )
	genre=$( mpc list genre | awk NF | wc -l )
	redis-cli hmset mpddb albumartist $albumartist composer $composer genre $genre
	exit
fi
# spotify activePlayer artist album song composer genre nas usb webradio sd
count=
count="$count $( redis-cli hget spotify enable )"
count="$count $( redis-cli get activePlayer )"
if [[ $( redis-cli hget display count ) != '' ]]; then
	count="$count $( mpc stats | head -n3 | awk '{print $2,$4,$6}' )"
	count="$count $( df | grep "/mnt/MPD/NAS" | wc -l )"
	count="$count $( df | grep "/mnt/MPD/USB" | wc -l )"
	count="$count $( redis-cli hkeys webradios | sed '/(empty list or set)/ d' | awk NF | wc -l )"
	count="$count $( redis-cli hget mpddb albumartist )"
	count="$count $( redis-cli hget mpddb composer )"
	count="$count $( redis-cli hget mpddb genre )"
fi
echo $count
