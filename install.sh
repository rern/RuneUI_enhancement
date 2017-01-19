#!/bin/bash

# install.sh - RuneUI enhancement
# https://github.com/rern/RuneUI_enhancement

# already installed
#		reinstall ?
#			exit
#			uninstall
# install
#		get uninstall.sh
#		get tar.xz
#		backup files
#		extract
#		restart nginx
#		clear opcache
#		restart midori
# success (skip if install with gpioinstall.sh)
#		info
# remove install files

arg=$#

linered='\e[0;31m---------------------------------------------------------\e[m'
line2='\e[0;36m=========================================================\e[m'
line='\e[0;36m---------------------------------------------------------\e[m'
bar=$( echo -e "$(tput setab 6)   $(tput setab 0)" )
warn=$( echo $(tput setab 1) ! $(tput setab 0) )
info=$( echo $(tput setab 6; tput setaf 0) i $(tput setab 0; tput setaf 7) )
runeenh=$( echo $(tput setaf 6)RuneUI Enhancement$(tput setaf 7) )

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

# check already installed #######################################

if grep -qs 'RuneUIe' /srv/http/app/templates/header.php; then
	title "$info $runeenh already installed."
	echo 'Reinstall' $runeenh':'
	echo -e '  \e[0;36m0\e[m No'
	echo -e '  \e[0;36m1\e[m Yes'
	echo
	echo -e '\e[0;36m0\e[m / 1 ? '
	read -n 1 answer
	case $answer in
		1 ) ./uninstall.sh re;; # with any argument to skip success message
		* ) echo
			titleend "$runeenh reinstall cancelled."
			rm install.sh
			exit;;	
	esac
fi

# install RuneUI enhancement #######################################

title2 "Install $runeenh ..."
title "Get files ..."
wget -q --show-progress -O RuneUI_enhancement.tar.xz "https://github.com/rern/RuneUI_enhancement/blob/master/_repo/RuneUI_enhancement.tar.xz?raw=1"
wget -q --show-progress -O uninstall.sh "https://github.com/rern/RuneUI_enhancement/blob/master/uninstall.sh?raw=1"
chmod +x uninstall.sh

title "Backup existing files ..."
file='/etc/nginx/nginx.conf'
cp -v $file $file'.bak'
file='/root/.config/midori/config'
cp -v $file $file'.bak'
path='/srv/http/app/templates/'
file=$path'footer.php'
cp -v $file $file'.bak'
file=$path'header.php'
cp -v $file $file'.bak'
file=$path'playback.php'
cp -v $file $file'.bak'

title "Install files ..."
tar -Jxvf RuneUI_enhancement.tar.xz -C /

systemctl restart nginx # for added svg format

# local display zoom #######################################

title "$info Select local browser screen size:"
echo 'Set zoom level for display directly connect to RPi.'
echo
echo 'Screen size:'
echo -e '  \e[0;36m1\e[m Small     ( 0.7 : width less than 800px )'
echo -e '  \e[0;36m2\e[m Medium    ( 1.2 : HD - 1280px )'
echo -e '  \e[0;36m3\e[m Large     ( 1.5 : Full HD - 1920px)'
echo
echo -e '\e[0;36m1\e[m / 2 / 3 ? '
read -n 1 answer
case $answer in
	2 ) zoom=1.2;;
	3 ) zoom=1.5;;
	* ) zoom=0.7;;
esac
sed -i 's/zoom-level=1.5/zoom-level='$zoom'/' /root/.config/midori/config

if [ $arg -eq 0 ]; then # skip if run from gpioinstall.sh - install.sh <arg>
	title "Clear PHP OPcache ..."
	curl '127.0.0.1/clear'
	echo

	killall midori
	sleep 1
	startx  > /dev/null 2>&1 &
	echo -e '\nLocal browser restarted.\n'

	title2 "$runeenh successfully installed."
	echo $info 'Refresh browser to start using' $runeenh'.'
	titleend "To uninstall:   ./uninstall.sh"
fi

rm RuneUI_enhancement.tar.xz
rm install.sh
