#!/bin/bash

killall Xorg
ply-image /srv/http/assets/img/bootsplash.png
umount -f -a -t nfs -l
umount -f -a -t cifs -l
