#!/bin/bash

url=${1//\//.}
radio=$( redis-cli hgetall webradios )
valueline=$( echo "$radio" | sed -n "/$url/ =" )
keyline=$(( valueline - 1 ))
name=$( echo "$radio" | sed "$keyline q;d" )

echo $name
