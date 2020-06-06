#! /bin/sh
set -x
usage(){
	echo "usage: $0 [-d] [-l osline(ubuntu)] [-r osversion(bionic)] [-t tagname]"
}
adddev=false
osline=ubuntu
osversion=bionic
while getopts "dl:r:t:" flag
do
	case "${flag}" in
		d)
			adddev=true
			;;
		r)
			osversion=$OPTARG
			;;
		l)
			osline=$OPTARG
			;;
		t)
			tagname="$OPTARG"
			;;
		*)
			echo "invalid option"
			usage
			exit 1
			;;
	esac
done

if [ "$tagname" = "" ] ; then
	tagname="opencpn-build:$osline-$osversion"
fi

docker build --build-arg UID=`id -u` --build-arg GID=`id -g` --build-arg USER=`id -u -n` --build-arg OSLINE=$osline --build-arg OSVERSION=$osversion --build-arg DEVENV=$adddev -t "$tagname" .

