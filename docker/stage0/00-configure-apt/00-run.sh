#!/bin/bash -e

echo "deb http://raspbian.raspberrypi.org/raspbian/ $RASPBIAN_VERSION main contrib non-free rpi" >  "${ROOTFS_DIR}/etc/apt/sources.list"
chmod 644  "${ROOTFS_DIR}/etc/apt/sources.list"

if [ -n "$APT_PROXY" ]; then
	install -m 644 files/51cache "${ROOTFS_DIR}/etc/apt/apt.conf.d/51cache"
	sed "${ROOTFS_DIR}/etc/apt/apt.conf.d/51cache" -i -e "s|APT_PROXY|${APT_PROXY}|"
else
	rm -f "${ROOTFS_DIR}/etc/apt/apt.conf.d/51cache"
fi

on_chroot apt-key add - < files/raspberrypi.gpg.key
on_chroot << EOF
apt-get update
EOF
