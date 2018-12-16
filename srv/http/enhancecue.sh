#!/bin/bash

# enhancecue.sh "CUE" SONG

cueL=$( mpc playlist "$1" | wc -l )
playlistL=$( mpc playlist | wc -l )
range=$( seq $(( playlistL + 1 )) $(( playlistL + cueL )) )
song=$(( playlistL + $2 ))
rangeDel=${range/$song}
mpc load "$1"
mpc del $rangeDel
