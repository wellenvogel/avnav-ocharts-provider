#!/bin/bash -e

if [ ! -d "${ROOTFS_DIR}" ]; then
	bootstrap "${RASPBIAN_VERSION}" "${ROOTFS_DIR}" http://raspbian.raspberrypi.org/raspbian/
fi
