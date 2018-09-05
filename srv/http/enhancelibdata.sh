#!/bin/bash

data="$( df | grep "/mnt/MPD/NAS" | wc -l )"
data="$data $( mpc list title base LocalStorage | awk NF | wc -l )"
data="$data $( df | grep "/mnt/MPD/USB" | wc -l )"
data="$data $( redis-cli hkeys webradios | wc -l )"
types=( album artist composer genre title )
for type in "${types[@]}"; do
	data="$data $( mpc list $type | awk NF | wc -l )"
done
data="$data $( redis-cli hget spotify enable )"
data="$data $( redis-cli get activePlayer )"

bookmarks=( $( redis-cli hgetall bookmarks ) )
ilength=${#bookmarks[*]}
for (( i=0; i < ilength; i+=2 )); do
	json=${bookmarks[i+1]}
	id=${bookmarks[i]}
	path=$( echo $json | cut -d'"' -f8 | tr -d '\' 2>/dev/null )
	count=$( mpc list title base $path | awk NF | wc -l )
	bk=$( echo $json | sed 's/\("name":\)/"id":"'$id'","count":"'$count'",\1/' )
done

data="$data $bk"

echo $data
