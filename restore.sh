#!/bin/bash

linered='\e[0;31m---------------------------------------------------------\e[m'
line2='\e[0;36m=========================================================\e[m'
line='\e[0;36m---------------------------------------------------------\e[m'
bar=$( echo -e "$(tput setab 6)   $(tput setab 0)" )
info=$( echo $(tput setab 6; tput setaf 0) i $(tput setab 0; tput setaf 7) )

# functions #######################################

title2() {
		echo -e "\n$line2\n"
		echo -e "$bar $1"
		echo -e "\n$line2\n"
}
title() {
		echo -e "\n$line"
		echo $1
		echo -e "$line\n"
}
titleend() {
		echo -e "\n$1"
		echo -e "\n$line\n"
}

# restore #######################################
title2 "Restore original files for RuneUI ..."

title "Get files ..."
wget -q --show-progress -O original.tar.xz "https://github.com/rern/RuneUI_enhancement/blob/master/_repo/original.tar.xz?raw=1"
mkdir /tmp/original
tar -Jxvf original.tar.xz -C /tmp/original
rm original.tar.xz

title "Compare files ..."

original='/tmp/original/header.php'
file='/srv/http/app/templates/header.php'
[ ! cmp -s original file ] && cp -v original file

original='/tmp/original/footer.php'
file='/srv/http/app/templates/footer.php'
[ ! cmp -s original file ] && cp -v original file

original='/tmp/original/playback.php'
file='/srv/http/app/templates/playback.php'
[ ! cmp -s original file ] && cp -v original file

original='/tmp/original/nginx.conf'
file='/etc/nginx/nginx.conf'
[ ! cmp -s original file ] && cp -v original file

original='/tmp/original/config'
file='/root/.config/midori/config'
[ ! cmp -s original file ] && cp -v original file

# refresh #######################################
title "Clear PHP OPcache ..."
curl '127.0.0.1/clear'
echo

if pgrep midori > /dev/null; then
	export DISPLAY=:0
	midori -p -e Fullscreen http://localhost > /dev/null &
fi

title2 "RuneUI files successfully restored."
titleend "$info Refresh browser for default RuneUI."

rm restore.sh
