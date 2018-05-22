#!/bin/bash

mpc play
sampling=
i=0
until [[ i -eq 10 ]]; do
	sampling=$( { echo status; sleep 0.1; } | telnet localhost 6600 | grep 'bitrate\|audio' )
	(( i++ ))
	[[ -n $sampling && $sampling != 'bitrate: 0' ]] && break || sleep 0.1
done

mpc stop

bitrate=$( echo $sampling | cut -d' ' -f2 )
bitdepth=$( echo $sampling | cut -d' ' -f4 | cut -d':' -f2 )
Hz=$( echo $sampling | cut -d' ' -f4 | cut -d':' -f1 )
kHz=$( awk "BEGIN { printf \"%.1f\n\", "$Hz" / 1000 }" )

echo $bitdepth bit $kHz kHz $bitrate kbit/s
