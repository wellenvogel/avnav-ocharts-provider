#! /bin/bash
#set -x

usage(){
	echo "usage: $0 [-c] [-i dockerImageName] [-n containerName] [-b buildDir] [-a] debug|release|raspi"
}

#relative path of cmakelist dir from this script
SRCDIR=.
doClean=0
container="opencpn-dev-compile"
image="opencpn-build:ubuntu-bionic"
imageraspi="opencpn-pi-cross:buster"
user=""
chrootuser=""
buildDir=""
DOCKERIMAGE=""
ttyopt="-t"
bFlag=""
while getopts cn:i:ub:a opt
do
	case $opt in
		c)
		doClean=1
		;;
		n)
		container="$OPTARG"
		;;
		i)
		DOCKERIMAGE="$OPTARG"
		;;
		u)
		user="-u `id -u -n`"
		chrootuser="--userspec=`id -u -n`"
		;;
		b)
		buildDir="$OPTARG"
		bFlag="-b $OPTARG"
		;;
		a)
		ttyopt=""
		;;
		*)
		usage
		exit 1
		;;
	esac
done

shift `expr $OPTIND - 1`

if [ "$1" = "" ] ; then
  usage
  exit 1
fi

mode=$1
shift
PDIR=`dirname $0`
PDIR=`readlink -f "$PDIR"`

CMAKE_MODE=Release
DIR="$buildDir"

case $mode in
	debug)
		[ "$DIR" = "" ] && DIR=debug
		CMAKE_MODE=Debug
		[ "$DOCKERIMAGE" = "" ] && DOCKERIMAGE="$image"
	;;
	debug-intern)
		[ "$DIR" = "" ] && DIR=debug
		CMAKE_MODE=Debug
	;;
	release)
		[ "$DIR" = "" ] && DIR=release
		CMAKE_MODE=Release
		[ "$DOCKERIMAGE" = "" ] && DOCKERIMAGE="$image"
	;;
	release-intern)
		[ "$DIR" = "" ] && DIR=release
		CMAKE_MODE=Release
	;;
	raspi)
		[ "$DIR" = "" ] && DIR=raspi
		CMAKE_MODE=Release
		[ "$DOCKERIMAGE" = "" ] && DOCKERIMAGE="$imageraspi"
	;;
	raspi-intern)
		[ "$DIR" = "" ] && DIR=raspi
		CMAKE_MODE=Release
	;;
	*)
	echo "invalid mode $mode"
	usage
	exit 1
	;;
esac

BUILD_DIR="$PDIR/$DIR"
if [ $doClean  = 1 ] ; then
	if [ -d "$BUILD_DIR" ] ; then
		echo "cleaning $BUILD_DIR"
		rm -rf "$BUILD_DIR"
	fi
fi
if [ ! -d "$BUILD_DIR" ] ; then
	mkdir -p $BUILD_DIR || exit 1
	doClean=1
fi
cd $BUILD_DIR || exit 1
if [ $mode = raspi -o $mode = debug -o $mode = release ] ; then
	CONTAINER_RUNNING=$(docker ps --filter name="${container}" -q)
	CONTAINER_EXISTS=$(docker ps -a --filter name="${container}" -q)
	IMAGE_EXISTS=$(docker images -q "$DOCKERIMAGE")
	if [ "$CONTAINER_RUNNING" != "" ] ; then
		echo "the container $container is already running"
		exit 1
	fi
	if [ "$CONTAINER_EXISTS" != "" ] ; then
		echo "the container $container already exists"
		exit 1
	fi
	if [ "$IMAGE_EXISTS" = "" ] ; then
		echo "the image $DOCKERIMAGE does not exist"
		exit 1
	fi
	cflag=""
	[ $doClean = 1 ] && cflag="-c"
	if [ $mode = raspi ] ; then
		DOCKER_ROOT=/pi-cross/rootfs
		set -x
		docker run --rm --name "$container" -i $ttyopt  -v $PDIR:$DOCKER_ROOT/src "$DOCKERIMAGE" /bin/bash -c "chroot $chrootuser $DOCKER_ROOT qemu-arm-static /bin/bash  src/build.sh $bFlag $cflag raspi-intern"
		exit $?
	fi
	set -x 
	docker run --rm --name "$container" -i $ttyopt  -v $PDIR:/src $user "$DOCKERIMAGE" /bin/bash -c "cd /src && ./build.sh $bFlag $cflag $mode-intern"
	exit $?
fi
if [ $doClean = 1 ] ; then
	cmake -DCMAKE_BUILD_TYPE=$CMAKE_MODE ../$SRCDIR 
fi
make



