#!/bin/bash

# enhance1cuem3u.sh "CUE" SONG

cuem3uL=$( mpc playlist "$1" | wc -l )
playlistL=$( mpc playlist | wc -l )
range=$( seq $(( playlistL + 1 )) $(( playlistL + cuem3uL )) )
song=$(( playlistL + $2 ))
rangeDel=${range/$song}
mpc load "$1"
mpc del $rangeDel
