#!/bin/bash

mpc play

$i=0
until [[ sampling=$( { echo status; sleep 0.1; } | telnet localhost 6600 | grep 'bitrate\|audio' ) || $i == 10 ]]; do
	(( i++ ))
done

mpc stop

bitrate=$( echo $sampling | cut -d' ' -f2 )
bitdepth=$( echo $sampling | cut -d' ' -f4 | cut -d':' -f2 )
Hz=$( echo $sampling | cut -d' ' -f4 | cut -d':' -f1 )
kHz=$( awk "BEGIN { printf \"%.1f\n\", $Hz / 1000 }" )

echo $bitdepth bit $kHz kHz $bitrate kbit/s
