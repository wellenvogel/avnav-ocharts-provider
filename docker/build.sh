#!/bin/bash -e
# shellcheck disable=SC2119
IMG_NAME="opencpn-dev"
run_sub_stage()
{
	log "Begin ${SUB_STAGE_DIR}"
	pushd "${SUB_STAGE_DIR}" > /dev/null
	for i in {00..99}; do
		if [ -f "${i}-debconf" ]; then
			log "Begin ${SUB_STAGE_DIR}/${i}-debconf"
			on_chroot << EOF
debconf-set-selections <<SELEOF
$(cat "${i}-debconf")
SELEOF
EOF

		log "End ${SUB_STAGE_DIR}/${i}-debconf"
		fi
		if [ -f "${i}-packages-nr" ]; then
			log "Begin ${SUB_STAGE_DIR}/${i}-packages-nr"
			PACKAGES="$(sed -f "${SCRIPT_DIR}/remove-comments.sed" < "${i}-packages-nr")"
			if [ -n "$PACKAGES" ]; then
				on_chroot << EOF
apt-get install --no-install-recommends -y $PACKAGES
EOF
			fi
			log "End ${SUB_STAGE_DIR}/${i}-packages-nr"
		fi
		if [ -f "${i}-packages" ]; then
			log "Begin ${SUB_STAGE_DIR}/${i}-packages"
			PACKAGES="$(sed -f "${SCRIPT_DIR}/remove-comments.sed" < "${i}-packages")"
			if [ -n "$PACKAGES" ]; then
				on_chroot << EOF
apt-get install -y $PACKAGES
EOF
			fi
			log "End ${SUB_STAGE_DIR}/${i}-packages"
		fi
		if [ -d "${i}-patches" ]; then
			log "Begin ${SUB_STAGE_DIR}/${i}-patches"
			pushd "${STAGE_WORK_DIR}" > /dev/null
			if [ "${CLEAN}" = "1" ]; then
				rm -rf .pc
				rm -rf ./*-pc
			fi
			QUILT_PATCHES="${SUB_STAGE_DIR}/${i}-patches"
			SUB_STAGE_QUILT_PATCH_DIR="$(basename "$SUB_STAGE_DIR")-pc"
			mkdir -p "$SUB_STAGE_QUILT_PATCH_DIR"
			ln -snf "$SUB_STAGE_QUILT_PATCH_DIR" .pc
			quilt upgrade
			if [ -e "${SUB_STAGE_DIR}/${i}-patches/EDIT" ]; then
				echo "Dropping into bash to edit patches..."
				bash
			fi
			RC=0
			quilt push -a || RC=$?
			case "$RC" in
				0|2)
					;;
				*)
					false
					;;
			esac
			popd > /dev/null
			log "End ${SUB_STAGE_DIR}/${i}-patches"
		fi
		if [ -x ${i}-run.sh ]; then
			log "Begin ${SUB_STAGE_DIR}/${i}-run.sh"
			./${i}-run.sh
			log "End ${SUB_STAGE_DIR}/${i}-run.sh"
		fi
		if [ -f ${i}-run-chroot.sh ]; then
			log "Begin ${SUB_STAGE_DIR}/${i}-run-chroot.sh"
			on_chroot < ${i}-run-chroot.sh
			log "End ${SUB_STAGE_DIR}/${i}-run-chroot.sh"
		fi
	done
	popd > /dev/null
	log "End ${SUB_STAGE_DIR}"
}


run_stage(){
	log "Begin ${STAGE_DIR}"
	STAGE="$(basename "${STAGE_DIR}")"
	pushd "${STAGE_DIR}" > /dev/null
	STAGE_WORK_DIR="${WORK_DIR}"
	ROOTFS_DIR="${STAGE_WORK_DIR}"/rootfs
	if [ ! -f SKIP ]; then
		if [ -x prerun.sh ]; then
			log "Begin ${STAGE_DIR}/prerun.sh"
			./prerun.sh
			log "End ${STAGE_DIR}/prerun.sh"
		fi
		for SUB_STAGE_DIR in "${STAGE_DIR}"/*; do
			if [ -d "${SUB_STAGE_DIR}" ] &&
			   [ ! -f "${SUB_STAGE_DIR}/SKIP" ]; then
				run_sub_stage
			fi
		done
	fi
	popd > /dev/null
	log "End ${STAGE_DIR}"
}

if [ "$(id -u)" != "0" ]; then
	echo "Please run as root" 1>&2
	exit 1
fi

BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export BASE_DIR

if [ -f config ]; then
	# shellcheck disable=SC1091
	source config
fi

while getopts "c:t:u" flag
do
	case "$flag" in
		c)
			EXTRA_CONFIG="$OPTARG"
			# shellcheck disable=SC1090
			source "$EXTRA_CONFIG"
			;;
		*)
			;;
	esac
done


export USE_QEMU="${USE_QEMU:-0}"
export IMG_DATE="${IMG_DATE:-"$(date +%Y-%m-%d)"}"

export SCRIPT_DIR="${BASE_DIR}/scripts"
export WORK_DIR="${WORK_DIR:-"${BASE_DIR}/work"}"
export LOG_FILE="${WORK_DIR}/build.log"

export HOSTNAME=${HOSTNAME:-raspberrypi}

export FIRST_USER_NAME=${FIRST_USER_NAME:-pi}
export FIRST_USER_PASS=${FIRST_USER_PASS:-raspberry}
export WPA_ESSID
export WPA_PASSWORD
export WPA_COUNTRY
export ENABLE_SSH="${ENABLE_SSH:-0}"

export LOCALE_DEFAULT="${LOCALE_DEFAULT:-en_GB.UTF-8}"

export KEYBOARD_KEYMAP="${KEYBOARD_KEYMAP:-gb}"
export KEYBOARD_LAYOUT="${KEYBOARD_LAYOUT:-English (UK)}"

export TIMEZONE_DEFAULT="${TIMEZONE_DEFAULT:-Europe/London}"

export GIT_HASH=${GIT_HASH:-"$(git rev-parse HEAD)"}

export CLEAN
export IMG_NAME
export APT_PROXY

export STAGE
export STAGE_DIR
export STAGE_WORK_DIR
export PREV_STAGE
export PREV_STAGE_DIR
export ROOTFS_DIR
export PREV_ROOTFS_DIR
export IMG_SUFFIX
export NOOBS_NAME
export NOOBS_DESCRIPTION
export EXPORT_DIR
export EXPORT_ROOTFS_DIR

export QUILT_PATCHES
export QUILT_NO_DIFF_INDEX=1
export QUILT_NO_DIFF_TIMESTAMPS=1
export QUILT_REFRESH_ARGS="-p ab"

# shellcheck source=scripts/common
source "${SCRIPT_DIR}/common"
# shellcheck source=scripts/dependencies_check
source "${SCRIPT_DIR}/dependencies_check"

dependencies_check "${BASE_DIR}/depends"

#check username is valid
if [[ ! "$FIRST_USER_NAME" =~ ^[a-z][-a-z0-9_]*$ ]]; then
	echo "Invalid FIRST_USER_NAME: $FIRST_USER_NAME"
	exit 1
fi

if [[ -n "${APT_PROXY}" ]] && ! curl --silent "${APT_PROXY}" >/dev/null ; then
	echo "Could not reach APT_PROXY server: ${APT_PROXY}"
	exit 1
fi

mkdir -p "${WORK_DIR}"
log "Begin ${BASE_DIR}"

STAGE_LIST=${STAGE_LIST:-${BASE_DIR}/stage*}

for STAGE_DIR in $STAGE_LIST; do
	STAGE_DIR=$(realpath "${STAGE_DIR}")
	run_stage
done

if [ -x postrun.sh ]; then
	log "Begin postrun.sh"
	cd "${BASE_DIR}"
	./postrun.sh
	log "End postrun.sh"
fi

log "End ${BASE_DIR}"
