#!/bin/bash

# artist album song composer genre nas usb webradio sd spotify activePlayer
count=
count="$count $( redis-cli hget spotify enable )"
count="$count $( redis-cli get activePlayer )"
if [[ $( redis-cli hget display count ) != '' ]]; then
	count="$count $( mpc stats | head -n3 | awk '{print $2,$4,$6}' )"
	count="$count $( mpc list albumartist | awk NF | wc -l )"
	count="$count $( mpc list composer | awk NF | wc -l )"
	count="$count $( mpc list genre | awk NF | wc -l )"
	count="$count $( df | grep "/mnt/MPD/NAS" | wc -l )"
	count="$count $( df | grep "/mnt/MPD/USB" | wc -l )"
	count="$count $( redis-cli hkeys webradios | sed '/(empty list or set)/ d' | awk NF | wc -l )"
fi
echo $count
