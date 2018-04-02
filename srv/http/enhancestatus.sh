#!/bin/bash

playpause=$( mpc status | grep ')' )
if [[ ! $playpause ]]; then
	data=( $( { { echo -e 'play'; sleep 0.1; } | telnet localhost 6600; { echo -e 'status\nstop'; sleep 0.1; } | telnet localhost 6600; } | grep "bitrate\|audio" | tr -d "\n" | sed "s/bitrate: *//; s/audio: *\|:/ /g" ) )
	data+=( $( { mpc play; mpc status; mpc stop; } | grep ")" | sed "s/\[.*\] *#.*   *\|\// /g; s/ (.*)//" ) )
else
	data=( $( { echo status; sleep 0.1; } | telnet localhost 6600 | grep "bitrate\|audio" | tr -d "\n" | sed "s/bitrate: *//; s/audio: *\|:/ /g" ) )
	data+=( $( mpc status | grep ")" | sed "s/\[.*\] *#.*   *\|\// /g; s/ (.*)//" ) )
fi

if [[ ${data[2]} == dsd ]]; then
	dsd=$(( ${data[1]} / 44100 * 8 ))
	bitrate=$( perl -E "say $dsd * 44.1" )
	bitrate=$( printf "%.0f" $bitrate )
	json="1 bit DSD$dsd - $bitrate kbit/s"
else
	freq=$( perl -E "say ${data[1]} / 1000" )
	bitrate=$( perl -E "say ${data[2]} * $freq * ${data[3]}" )
	bitrate=$( printf "%.0f" $bitrate )
	json="${data[2]} bit $freq kHz $bitrate kbit/s"
fi

toSecond() {
	echo $1 | awk -F':' '{ if ( NF == 2 ) { print $1 * 60 + $2 } else { print $1 * 60 * 60 + $2 * 60 + $3 } }'
}

elapsed=$( toSecond ${data[4]} )
time=$( toSecond ${data[5]} )

echo '{ "fileinfo": "'$json'", "elapsed": "'$elapsed'", "time": "'$time'", "total": "'${data[5]}'" }'