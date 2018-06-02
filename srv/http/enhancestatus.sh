#!/bin/bash

status=$( { echo status; sleep 0.1; } | telnet localhost 6600 )

state=$( echo "$status" | grep '^state: ' | cut -d' ' -f2 )
volume=$( echo "$status" | grep '^volume: ' | cut -d' ' -f2 )
volumemute=$( redis-cli get volumemute )
repeat=$( echo "$status" | grep '^repeat: ' | cut -d' ' -f2 )
random=$( echo "$status" | grep '^random: ' | cut -d' ' -f2 )
single=$( echo "$status" | grep '^consume: ' | cut -d' ' -f2 )

if [[ $state != stop ]]; then
	elapsed=$( echo "$status" | grep '^time: ' | cut -d' ' -f2 | cut -d':' -f1 )
else
	elapsed=0
fi

# get filename within bash avoids character escaping
data=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 )
filepath=$( echo "$data" | grep -a file )
# before initial play, playlist not response to 'currentsong'
if [[ ! $filepath ]]; then
	mpc play
	mpc stop
	data=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 )
	filepath=$( echo "$data" | grep -a file )
fi

track=$( echo "$data" | sed 's/"/\\/g' ) # escape double quotes for json output
	
if [[ ${filepath:6:4} == http ]]; then
	url=$( echo "$filepath" | sed 's/^file: //' )
	file=/srv/http/stream
	ext=radio
	album=$url
#	artist=$( echo "$track" | grep -a Name | sed 's/^Name: //' )
#	[[ ! $artist ]] && artist=$( redis-cli hget webradioname "$url" )
	artist=$( redis-cli hget webradioname "$url" )
	song=$( echo "$track" | grep -a Title | sed 's/^Title: //' )
	if [[ -z $artist ]]; then
		artist=$song
		song=
	fi
	time=0
else
	file=$( echo "$filepath" | sed 's|^file: |/mnt/MPD/|' )
	ext=$( echo $file | sed 's/^.*\.//' | tr '[:lower:]' '[:upper:]' )
	artist=$( echo "$track" | grep Artist | sed 's/Artist: //' )
	song=$( echo "$track" | grep Title | sed 's/Title: //' )
	album=$( echo "$track" | grep Album | sed 's/Album: //' )
	time=$( echo "$track" | grep Time | sed 's/Time: //' )
fi

samplinginfo() {
	local bitdepth=$1
	local samplerate=$2
	local bitrate=$3
	
	if [[ $bitdepth == 'N/A' ]]; then
		if [[ $ext == WAV || $ext == AIFF ]]; then
			bitdepth=$(( $bitrate / $samplerate / 2 ))' bit '
		else
			bitdepth=
		fi
	elif [[ $bitdepth != 0 ]]; then
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
}

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

# not DSD or m4a - get sampling with 'ffprobe'
elif [[ $ext == radio ]]; then
	if [[ $state == stop ]]; then
		sampling=$( redis-cli hget webradiosampling "$artist" )
	else
		bitdepth=0
		samplerate=$( echo "$status" | grep '^audio: ' | cut -d' ' -f2 | cut -d':' -f1 )
		bitrate=$( echo "$status" | grep '^bitrate: ' | cut -d' ' -f2 )
		# refetch if too soon to connect properly
		if [[ $samplerate == 0 || $bitrate == 0 || -z $samplerate || -z $birate ]]; then
			status=$( { echo status; sleep 0.1; } | telnet localhost 6600 )
			samplerate=$( echo "$status" | grep '^audio: ' | cut -d' ' -f2 | cut -d':' -f1 )
			bitrate=$( echo "$status" | grep '^bitrate: ' | cut -d' ' -f2 )
		fi
		bitrate=$(( bitrate * 1000 ))
		samplinginfo $bitdepth $samplerate $bitrate
		redis-cli hset webradiosampling "$artist" "$sampling"
	fi
else
	data=( $( ffprobe -v quiet -select_streams a:0 -show_entries stream=bits_per_raw_sample,sample_rate -show_entries format=bit_rate -of default=noprint_wrappers=1:nokey=1 "$file" ) )
	bitdepth=${data[1]}
	samplerate=${data[0]}
	bitrate=${data[2]}
	samplinginfo $bitdepth $samplerate $bitrate
fi

echo '{ "artist": "'$artist'", "song": "'$song'", "album": "'$album'", "sampling": "'$sampling'", "ext": "'$ext'", "elapsed": "'$elapsed'", "time": "'$time'", "repeat": "'$repeat'", "random": "'$random'", "single": "'$single'", "volume": "'$volume'", "volumemute": "'$volumemute'", "state": "'$state'" }'
