#!/bin/bash

url=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 | grep -a file )
file=sampling
curl -sm 1 ${url:6} -o $file
[[ ! -e $file ]] && curl -sm 2 ${url:6} -o $file
if [[ ! -e $file ]]; then
	echo '&nbsp;'
	exit
fi

IFS0=$IFS
IFS=$( echo -en "\n\b" )
data=( $( ffprobe -v quiet -select_streams a:0 -show_entries stream=bits_per_raw_sample,sample_rate -show_format_entry bit_rate -of default=noprint_wrappers=1:nokey=1 "$file" ) )
IFS=$IFS0

rm $file
#bitdepth=${data[1]}
samplerate=${data[0]}
bitrate=${data[2]}

(( $samplerate % 1000 )) && decimal='%.1f\n' || decimal='%.0f\n'
samplerate=$( awk "BEGIN { printf \"$decimal\", $samplerate / 1000 }" )' kHz '
bitrate=$(( bitrate / 1000 ))' kbit/s'

echo $samplerate$bitrate
