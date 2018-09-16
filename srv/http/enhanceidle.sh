#!/bin/bash

while true; do
	curl -s -X POST "http://localhost/pub?id=idle" -d \"$( mpc idle )\"
done
