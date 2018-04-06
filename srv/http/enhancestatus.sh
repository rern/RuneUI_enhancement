#!/bin/bash

state=$( mpc status | grep '\[' | sed 's/\[\(.*\)\].*/\1/' )
[[ ! $state ]] && state=stop

if [[ $state != stop ]]; then
	elapsed=( $( mpc status | grep ')' | sed 's/.*#.*   *//; s|/.*||' ) )
	elapsed=$( echo $elapsed | awk -F':' '{ if ( NF == 2 ) { print $1 * 60 + $2 } else { print $1 * 60 * 60 + $2 * 60 + $3 } }' )
else
	elapsed=0
fi

# get file within bash avoids character escaping ( grep -a : fix filename with diacritics )
filetime=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 | grep -a 'file:\|Time:' | sed 's|file: |/mnt/MPD/|' )
# initial playlist not response to 'currentsong'
if [[ ! $filetime ]]; then
	mpc play
	mpc stop
	filetime=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 | grep 'file:\|Time:' | sed 's|file: |/mnt/MPD/|' )
fi
file=${filetime/Time:*}
ext=$( echo $file | sed 's/^.*\.//' | tr '[:lower:]' '[:upper:]' )
time=${filetime#*Time: }

# not DSD - get sampling with 'soxi'
if [[ $ext != DSF && $ext != DFF ]]; then
	IFS0=$IFS
	IFS=$( echo -en "\n\b" )
	data=$( soxi $file | grep 'Channels\|Sample Rate\|Precision' | tr -d '\n' )
	IFS=$IFS0
	
	audio=( $( echo $data | sed 's/Channels : \|Sample Rate :\|Precision :\|-bit//g' ) )
	channel=${audio[0]}
	bitdepth=${audio[2]}
	samplerate=$( awk "BEGIN { printf \"%.1f\n\", ${audio[1]} / 1000 }" )
	bitrate=$( awk "BEGIN { printf \"%.2f\n\", $channel * $bitdepth * $samplerate }" )
	sampling="$bitdepth bit $samplerate kHz $bitrate kbit/s"
	if (( ${bitrate%.*} >= 1000 )); then
		bitrate=$( awk "BEGIN { printf \"%.2f\n\", $bitrate / 1000 }" )
		sampling="$bitdepth bit $samplerate kHz $bitrate Mbit/s"
	fi
# DSD - get sampling by 'hexdump'
else
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
fi

echo '{ "sampling": "'$sampling'", "elapsed": "'$elapsed'", "time": "'$time'", "state": "'$state'" }'
