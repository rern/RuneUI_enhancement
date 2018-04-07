#!/bin/bash

status=$( mpc status )
state=$( echo "$status" | grep '\[' | sed 's/\[\(.*\)\].*/\1/' )
[[ ! $state ]] && state=stop
volumemode=( $( echo "$status" | grep volume | tr -d ' ' | sed 's/volume:\|%repeat\|random\|single\|consume//g; s/:/ /g; s/on/1/g; s/off/0/g' ) )
volume=${volumemode[0]}
volumemute=$( redis-cli get volumemute )
repeat=${volumemode[1]}
random=${volumemode[2]}
single=${volumemode[3]}

if [[ $state != stop ]]; then
	elapsed=( $( echo "$status" | grep '\[' | sed 's/.*#.*   *//; s|/.*||' ) )
	elapsed=$( echo $elapsed | awk -F':' '{ if ( NF == 2 ) { print $1 * 60 + $2 } else { print $1 * 60 * 60 + $2 * 60 + $3 } }' )
else
	elapsed=0
fi

# get filename within bash avoids character escaping
data=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 )
file=$( echo "$data" | grep file | sed 's|file: |/mnt/MPD/|' )

# initial playlist not response to 'currentsong'
if [[ ! $file ]]; then
	mpc play
	mpc stop
	data=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 )
	file=$( echo "$data" | grep file | sed 's|file: |/mnt/MPD/|' )
fi

ext=$( echo $file | sed 's/^.*\.//' | tr '[:lower:]' '[:upper:]' )

track=$( echo "$data" | sed 's/"/\\/g' ) # escape double quotes for json output
artist=$( echo "$track" | grep Artist | sed 's/Artist: //' )
song=$( echo "$track" | grep Title | sed 's/Title: //' )
album=$( echo "$track" | grep Album | sed 's/Album: //' )
time=$( echo "$track" | grep Time | sed 's/Time: //' )

# DSD - get sampling by 'hexdump'
if [[ $ext == DSF || $ext == DFF ]]; then
	IFS0=$IFS
	IFS=$( echo -en "\n\b" )
	if [[ $ext == DSF ]]; then
		hexword=$( hexdump -x -s56 -n4 $file )
		IFS=$IFS0
		hex=( $( echo $hexword | cut -d' ' -f2,3 ) )
		bitrate=$( echo $(( 16#${hex[1]}${hex[0]} )) )
	else # DFF
		hexword=$( hexdump -x -s60 -n4 $file )
		IFS=$IFS0
		hex=( $( echo $hexword | cut -d' ' -f2,3 | tr -d ' ' | sed 's/.\{2\}/& /g' ) )
		bitrate=$( echo $(( 16#${hex[1]}${hex[0]}${hex[3]}${hex[2]} )) )
	fi
	dsd=$(( bitrate / 44100 ))
	Mbps=$( awk "BEGIN { printf \"%.2f\n\", $bitrate / 1000000 }" )
	sampling="1 bit DSD$dsd - $Mbps Mbit/s"
else
# not DSD or m4a - get sampling with 'soxi'
	IFS0=$IFS
	IFS=$( echo -en "\n\b" )
	data=( $( ffprobe -v quiet -select_streams a:0 -show_entries stream=sample_rate,channels,bits_per_raw_sample -show_format_entry bit_rate -of default=noprint_wrappers=1:nokey=1 "$file" ) )
	IFS=$IFS0
	
	
#	channel=${data[1]}
	bitdepth=${data[2]}
	bitrate=${data[3]}
	[[ $bitdepth ]] && bitdepth="$bitdepth bit " || bitdepth=''
	samplerate=$( awk "BEGIN { printf \"%.1f\n\", ${data[0]} / 1000 }" )
	kbps=$( awk "BEGIN { printf \"%.1f\n\", $bitrate / 1000 }" )
	Mbps=$( awk "BEGIN { printf \"%.2f\n\", $bitrate / 1000000 }" )
	(( $bitrate < 1000000 )) && bitrate="$kbps kbit/s" || bitrate="$Mbps Mbit/s"
	sampling="$bitdepth$samplerate kHz $bitrate"
fi

echo '{ "artist": "'$artist'", "song": "'$song'", "album": "'$album'", "sampling": "'$sampling'", "ext": "'$ext'", "elapsed": "'$elapsed'", "time": "'$time'", "repeat": "'$repeat'", "random": "'$random'", "single": "'$single'", "volume": "'$volume'", "volumemute": "'$volumemute'", "state": "'$state'" }'
