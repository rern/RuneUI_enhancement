#!/bin/bash

# remove install file
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
#		remove install tar.xz
#		restart nginx
#		clear opcache
#		restart midori
# success (skip if install with gpioinstall.sh)
#		info

rm install.sh

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
wget -q --show-progress -O srv.tar.xz "https://github.com/rern/RuneUI_enhancement/blob/master/_repo/srv.tar.xz?raw=1"
wget -q --show-progress -O uninstall.sh "https://github.com/rern/RuneUI_enhancement/blob/master/uninstall.sh?raw=1"
chmod +x uninstall.sh

title "Backup existing file ..."
file='/srv/http/app/templates/playback.php'
cp -v $file $file'.bak'

title "Install files ..."
tar -Jxvf srv.tar.xz -C /
rm srv.tar.xz

# modified files #######################################
sed -i -e 's/<title>RuneAudio - RuneUI<\/title>/<title>RuneAudio - RuneUIe<\/title>/
' -e $'/runeui.css/a \
    <link rel="stylesheet" href="<?=$this->asset(\'/css/pnotify.css\')?>">\
    <link rel="stylesheet" href="<?=$this->asset(\'/css/custom.css\')?>">\
    <?php if (preg_match(\'/mixer_type[\s]+"disabled"/\', file_get_contents(\'/etc/mpd.conf\'))): ?>\
    <link rel="stylesheet" href="<?=$this->asset(\'/css/customvoloff.css\')?>">\
    <?php endif ?>\
    <?php if ($this->coverart == 0): ?>\
    <link rel="stylesheet" href="<?=$this->asset(\'/css/customcoveroff.css\')?>">\
    <?php endif ?>\
' -e '/menu-top/i \
<div id="barleft"></div>\
<div id="barright"></div>
<div id="lyricfade" class="hide"></div>\
' -e 's/logo.png/runelogo.svg/
' -e '/poweroff-modal/i \
            <li class="<?=$this->uri(1, 'dev', 'active')?>"><a href="/dev/"><i class="fa fa-code"></i> Development</a></li>
' /srv/http/app/templates/header.php

echo $'\n<script src="<?=$this->asset(\'/js/vendor/pnotify3.custom.min.js\')?>"></script>
<script src="<?=$this->asset(\'/js/custom.js\')?>"></script>
<script src="<?=$this->asset(\'/js/vendor/hammer.min.js\')?>"></script>' >> /srv/http/app/templates/footer.php

# for nginx svg support #######################################
sed -i 's/(js|css|png|jpg|jpeg|gif|ico)/(js|css|png|jpg|jpeg|gif|ico|svg)/' /etc/nginx/nginx.conf
sed -i '/user-stylesheet-uri/d' /root/.config/midori/config
systemctl restart nginx

# for installed RuneUI password #######################################
if grep -qs 'logout.php' /srv/http/app/templates/header.php.bak; then
	sed -i '/poweroff-modal/a \
				<li><a href="/logout.php"><i class="fa fa-sign-out"></i> Logout</a></li>
	' /srv/http/app/templates/header.php
fi

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

	if pgrep midori > /dev/null; then
		killall midori
		sleep 1
		startx  > /dev/null 2>&1 &
		echo -e '\nLocal browser restarted.\n'
	fi

	title2 "$runeenh successfully installed."
	echo $info 'Refresh browser to start using' $runeenh'.'
	titleend "To uninstall:   ./uninstall.sh"
fi
