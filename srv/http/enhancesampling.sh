#!/bin/bash

ext=$( echo ${1##*.} | tr '[:lower:]' '[:upper:]' )
file=/mnt/MPD/$1

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
	data=( $( ffprobe -v quiet -select_streams a:0 -show_entries stream=bits_per_raw_sample,sample_rate -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "$file" ) )
	bitdepth=${data[1]}
	samplerate=${data[0]}
	bitrate=${data[2]}
	
	if [[ $bitdepth == 'N/A' ]]; then
		if [[ $ext == WAV || $ext == AIFF ]]; then
			bitdepth=$(( $bitrate / $samplerate / 2 ))' bit '
		else
			bitdepth=
		fi
	elif [[ -n $bitdepth ]]; then
		bitdepth=$bitdepth' bit '
	else
		bitdepth=
	fi
	
	if [[ $samplerate ]]; then
		(( $samplerate % 1000 )) && decimal='%.1f\n' || decimal='%.0f\n'
		samplerate=$( awk "BEGIN { printf \"$decimal\", $samplerate / 1000 }" )' kHz '
	fi
	
	if [[ $bitrate ]]; then
		if (( $bitrate < 1000000 )); then
			bitrate=$(( bitrate / 1000 ))' kbit/s'
		else
			bitrate=$( awk "BEGIN { printf \"%.2f\n\", $bitrate / 1000000 }" )' Mbit/s'
		fi
	fi
	
	sampling="$bitdepth$samplerate$bitrate"
fi

redis-cli hset sampling "$1" "$sampling" &> /dev/null
echo $sampling
