#!/bin/bash

if ! pacman -Q parted &>/dev/null; then
	wget -qN --show-progress https://github.com/rern/RuneAudio/raw/master/expand_partition/parted-3.2-5-armv7h.pkg.tar.xz
	pacman -U --noconfirm parted-3.2-5-armv7h.pkg.tar.xz
	rm parted-3.2-5-armv7h.pkg.tar.xz
fi

echo -e 'd\n\nn\n\n\n\n\nw' | fdisk /dev/mmcblk0 &>/dev/null
partprobe /dev/mmcblk0
resize2fs /dev/mmcblk0p2

if (( $? != 0 )); then
	echo "Failed: Expand partition. Try - reboot > SSH: resize2fs /dev/mmcblk0p2"
else
	freekb=$( df | grep '/$' | awk '{print $4}' )
	freemb=$( python2 -c "print($freekb / 1000)" )
	echo "root partiton now has $freemb MB free space."
	rm /root/expand.sh
fi
