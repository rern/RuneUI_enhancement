#!/bin/bash

# restore.sh
# for restoring files midified by RuneUI enhancement
# in case of uninstall.sh cannot completely restore them to their originals

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

title "Restore files ..."

original='/tmp/original/header.php'
file='/srv/http/app/templates/header.php'
cp -v $original $file
if grep -qs 'clock-display' /srv/http/assets/js/runeui.js; then
	sed -i 's/a class="home"/a id="clock-display" class="home"/' $file
fi

original='/tmp/original/footer.php'
file='/srv/http/app/templates/footer.php'
cp -v $original $file

original='/tmp/original/playback.php'
file='/srv/http/app/templates/playback.php'
cp -v $original $file

original='/tmp/original/nginx.conf'
file='/etc/nginx/nginx.conf'
cp -v $original $file

original='/tmp/original/config'
file='/root/.config/midori/config'
cp -v $original $file

rm -fr /tmp/original

# clean up #######################################
title "Clean up files ..."
file='/srv/http/lyrics.php'
[ -e $file ] && rm -v $file
path='/srv/http/assets/'
file=$path'css/custom.css'
[ -e $file ] && rm -v $file
file=$path'css/customcoveroff.css'
[ -e $file ] && rm -v $file
file=$path'css/customvoloff.css'
[ -e $file ] && rm -v $file
file=$path'img/runelogo.svg'
[ -e $file ] && rm -v $file
file=$path'js/custom.js'
[ -e $file ] && rm -v $file
file=$path'js/vendor/hammer.min.js'
[ -e $file ] && rm -v $file
file=$path'css/pnotify.css'
[ -e $file ] && rm -v $file
file=$path'js/vendor/pnotify3.custom.min.js'
[ -e $file ] && rm -v $file

# refresh #######################################
title "Clear PHP OPcache ..."
curl '127.0.0.1/clear'
echo

if pgrep midori > /dev/null; then
	export DISPLAY=:0
	midori -p -e Fullscreen http://localhost > /dev/null &
	echo '\nLocal browser refreshed.\n'
fi

title2 "RuneUI files successfully restored."
titleend "$info Refresh browser for default RuneUI."

rm restore.sh
