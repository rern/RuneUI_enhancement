#!/bin/bash

if [[ -z $2 ]]; then      # normal
	mpc volume $1
	curl -s -v -X POST 'http://localhost/pub?id=volume' -d '{ "vol": "'$1'", "volumemute": "0" }'
	exit
fi

if (( $2 != -1 )); then # mute
	mpc volume 0
	redis-cli set volumemute $2
	curl -s -v -X POST 'http://localhost/pub?id=volume' -d '{ "vol": "0", "volumemute": "'$2'" }'
else                    # unmute
	volumemute=$( redis-cli get volumemute )
	redis-cli set volumemute 0
	mpc volume $volumemute
	echo '{ "vol": "'$volumemute'", "volumemute": "-1" }'
	curl -s -v -X POST 'http://localhost/pub?id=volume' -d '{ "vol": "'$volumemute'", "volumemute": "-1" }'
fi

