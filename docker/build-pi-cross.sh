#!/bin/bash -eu

usage(){
	echo "usage: $0 [-c configFile] [-t dockerImageTag] [-i baseImage] [-r raspbianVersion(buster)]"
}
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd $DIR || exit 1

BUILD_OPTS="$*"

DOCKER="docker"

IMAGE=opencpn-dev-base
existingImage=0

RASPBIAN_VERSION=buster

if ! ${DOCKER} ps >/dev/null 2>&1; then
	DOCKER="sudo docker"
fi
if ! ${DOCKER} ps >/dev/null; then
	echo "error connecting to docker:"
	${DOCKER} ps
	exit 1
fi

CONFIG_FILE="pi-cross.conf"
TAG=""
while getopts "c:t:i:r:lf" flag
do
	case "${flag}" in
		c)
			CONFIG_FILE="${OPTARG}"
			;;
		t)
			TAG="${OPTARG}"
			;;
		i)
			IMAGE="$OPTARG"
			existingImage=1
			;;
		r)
			RASPBIAN_VERSION="$OPTARG"
			;;
		l)
                        #ignore this for compatibilty
                        ;;
                f)
			CONTINUE=1
			;;
		*)
			echo "invalid option"
			usage
			exit 1
			;;
	esac
done
if [ "$TAG" = "" ] ; then
  TAG="opencpn-build:raspbian-$RASPBIAN_VERSION"
fi

if [ "$CONFIG_FILE" = "" ] ; then
	echo "missing parameter -c configfile"
	usage
	exit 1
fi
if [ ! -f "$CONFIG_FILE" ] ; then
	echo "config file $CONFIG_FILE not found"
	exit 1
fi

# Ensure that the configuration file is an absolute path
if test -x /usr/bin/realpath; then
	CONFIG_FILE=$(realpath -s "$CONFIG_FILE")
fi

# Ensure that the confguration file is present
if test -z "${CONFIG_FILE}"; then
	echo "Configuration file need to be present in '${DIR}/config' or path passed as parameter"
	exit 1
else
	# shellcheck disable=SC1090
	source "${CONFIG_FILE}"
fi

LOCAL_CFG="_config"

[ -f $LOCAL_CFG ] && rm -f $LOCAL_CFG

cp $CONFIG_FILE $LOCAL_CFG || exit 1

usercmd="useradd -m -u `id -u` -g `id -g` `id -u -n`"
checkcmd="id -u `id -u -n`"
for n in stage-user/00-adduser/00-run-chroot.sh 
do	
	rm -f $n
	echo "#! /bin/bash" > $n
	echo "cat /etc/group | grep ':`id -g`:' || groupadd -g `id -g` `id -g -n`" >> $n
	echo "$checkcmd || $usercmd" >> $n
	chmod 755 $n
done

CONTAINER_NAME=${CONTAINER_NAME:-opencpn-dev-pi}
CONTINUE=${CONTINUE:-0}
PRESERVE_CONTAINER=${PRESERVE_CONTAINER:-1}



#inside container
WORK_DIR="/pi-cross"
DEPLOY_DIR="/deploy"
# Ensure the Git Hash is recorded before entering the docker container
GIT_HASH=${GIT_HASH:-"$(git rev-parse HEAD)"}

CONTAINER_EXISTS=$(${DOCKER} ps -a --filter name="${CONTAINER_NAME}" -q)
CONTAINER_RUNNING=$(${DOCKER} ps --filter name="${CONTAINER_NAME}" -q)
if [ "${CONTAINER_RUNNING}" != "" ]; then
	echo "The build is already running in container ${CONTAINER_NAME}. Aborting."
	exit 1
fi
if [ "${CONTAINER_EXISTS}" != "" ] && [ "${CONTINUE}" != "1" ]; then
	echo "Container ${CONTAINER_NAME} already exists and you did not specify CONTINUE=1. Aborting."
	echo "You can delete the existing container like this:"
	echo "  ${DOCKER} rm -v ${CONTAINER_NAME}"
	exit 1
fi
# Modify original build-options to allow config file to be mounted in the docker container
BUILD_OPTS="$(echo "${BUILD_OPTS:-}" | sed -E 's@\-c\s?([^ ]+)@-c '$LOCAL_CFG'@')"

if [ $existingImage = 1 ] ; then
	existing=$(${DOCKER} images -q "$IMAGE")
	if [ "$existing" = "" ] ; then
		echo "docker image $IMAGE does not exist" 
		exit 1
	fi
else
	${DOCKER} build -t "$IMAGE" -f Dockerfile.pigen "${DIR}"
fi

trap 'echo "signalhandler:... please wait " && ${DOCKER} stop -t 2 ${CONTAINER_NAME}' SIGINT SIGTERM 0
if [ "${CONTAINER_EXISTS}" != "" ]; then
	${DOCKER} start ${CONTAINER_NAME}
else
	${DOCKER} run --name "${CONTAINER_NAME}" --privileged -d \
		--volume "${DIR}":/pi-gen:ro \
		$IMAGE \
		bash -c "while true ; do sleep 1; done"
fi
( time ${DOCKER} exec ${CONTAINER_NAME} \
	bash -e -o pipefail -c "dpkg-reconfigure qemu-user-static &&
	cd /pi-gen; RASPBIAN_VERSION="$RASPBIAN_VERSION" WORK_DIR=$WORK_DIR DEPLOY_DIR=$DEPLOY_DIR GIT_HASH=$GIT_HASH ./build.sh ${BUILD_OPTS} -c $LOCAL_CFG" )
echo "stopping ${CONTAINER_NAME}"
${DOCKER} stop -t 2 ${CONTAINER_NAME}
if [ "$TAG" = "" ] ; then
	echo "build finished, no image created, container=$CONTAINER_NAME"
	exit 0
fi
echo "commiting to ${TAG}"
${DOCKER} commit "${CONTAINER_NAME}" "${TAG}"
