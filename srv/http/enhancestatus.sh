#!/bin/bash

toSecond() {
	echo $1 | awk -F':' '{ if ( NF == 2 ) { print $1 * 60 + $2 } else { print $1 * 60 * 60 + $2 * 60 + $3 } }'
}

if mpc status | grep ')'; then # playing or paused - get all with 'status' both mpd protocol and mpc
	data=( $( { echo status; sleep 0.1; } | telnet localhost 6600 | grep "bitrate\|audio" | tr -d '\n' | sed 's/bitrate: *//; s/audio: *\|:/ /g' ) )
	data+=( $( mpc status | grep ')' | sed 's/\] *#.*   *\|\// /g; s/\[\| (.*)//g' ) )
	
	bitdepth=${data[2]}
	[[ $bitdepth == 'dsd' ]] && bitdepth=1
	samplerate=$( perl -E "say ${data[1]} / 1000" )
	bitrate=$( perl -E "say ${data[2]} * $samplerate * ${data[3]}" )
	bitrate=$( printf "%.0f" $bitrate )
	sampling="$bitdepth bit $samplerate kHz $bitrate kbit/s"
	elapsed=$( toSecond ${data[5]} )
	time=$( toSecond ${data[6]} )
	state=${data[4]}
else
	# stop - get file and time with 'currentsong' mpd protocol
	filetime=$( { echo currentsong; sleep 0.1; } | telnet localhost 6600 | grep 'file:\|Time:' | sed 's|file: |/mnt/MPD/|' )
	file=${filetime/Time:*}
	ext=$( echo $file | sed 's/^.*\.//' )
	elapsed=0
	time=${filetime#*Time: }
	state='stop'
	
	if [[ $ext == dff ]]; then
		echo '{ "sampling": "'&nbsp;'", "elapsed": "0", "time": "0", "state": "stop" }'
		exit
	fi
	
	if [[ $ext != dsf ]]; then # not DSD - get sampling with 'soxi'
		IFS0=$IFS
		IFS=$( echo -en "\n\b" )
		data=$( soxi $file | grep 'Channels\|Sample Rate\|Precision' | tr -d '\n' )
		IFS=$IFS0
		
		audio=( $( echo $data | sed 's/Channels : \|Sample Rate :\|Precision :\|-bit//g' ) )
		channel=${audio[0]}
		bitdepth=${audio[2]}
		samplerate=$( python -c "print( ${audio[1]} / 1000 )" )
		bitrate=$( python -c "print( $channel * $bitdepth * $samplerate )" )
		
		sampling="$bitdepth bit $samplerate kHz $bitrate kbit/s"
	else # DSD - get sampling by 'hexdump'
		IFS0=$IFS
		IFS=$( echo -en "\n\b" )
		hexword=$( hexdump -x -s58 -n1 $file ) # byte 59 is most significant bit of dsd
		IFS=$IFS0
		hex=$( echo $hexword | cut -d' ' -f2 )
		dec=$((16#$hex))
		
		if (( dec == 43 )); then
			sampling='1 bit DSD64 - 2.82 Mbit/s'
		elif (( dec == 86 )); then
			sampling='1 bit DSD128 - 5.65 Mbit/s'
		elif (( dec == 172 )); then
			sampling='1 bit DSD256 - 11.29 Mbit/s'
		else
			sampling='1 bit DSD512 - 22.58 Mbit/s'
		fi
	fi
fi

echo '{ "sampling": "'$sampling'", "elapsed": "'$elapsed'", "time": "'$time'", "state": "'$state'" }'
