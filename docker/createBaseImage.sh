#! /bin/sh
error(){
  echo "ERROR: $*"
  exit 1
}
usage(){
  echo "usage: $0 arch line repourl image-tag [workdir]"
}

imageExists(){
  ie=`docker images -q $1`
  if [ "$ie" = "" ] ; then
    return 1
  else
    return 0
  fi
}

#set -x
if [ $# -lt 4 ] ; then
  usage
  error invalid usage
fi 
dir=`pwd`

arch=$1
line=$2
url="$3"
imagetag="$4"

if imageExists $imagetag ; then
  echo "image $imagetag" already exists
  exit 0
fi
if [ "$5" != "" ] ; then
  workdir="$5"
else
  workdir="basegen-$line"
fi
workdir=`readlink -f $workdir`
if [ -d $workdir ] ; then
  echo removing $workdir
  rm -rf $workdir
fi

mkdir -p $workdir || error "unable to create $workdir"

workfile="$workdir/create.sh"
tarfile="$workdir/$imagetag.tgz"
#within container
BR=/buildroot
outname=$BR/"$imagetag.tgz"
sed -n "/[#][#]START/,/[#][#]END/p" $0 | grep -v '^##' | sed -e "s/#ARCH#/$arch/g" -e "s/#LINE#/$line/g" -e "s@#URL#@$url@g" -e "s/#TAG#/$imagetag/g" > $workfile
chmod 755 $workfile
docker run --rm -ti -v "$workdir":$BR debian:buster /bin/sh $BR/create.sh
[ ! -f "$tarfile" ] && error "$tarfile not created"
gunzip -c $tarfile | docker import - "$imagetag" 

if imageExists "$imagetag" ; then
  echo "image $imagetag created"
   cd "$dir" && rm -rf "$workdir"
  exit 0
else
  echo "unable to create image $imagetag"
  exit 1
fi

##START
#/bin/sh
apt-get update
apt-get install -y debootstrap 
cd /buildroot
debootstrap --variant=minbase --foreign --arch=#ARCH# --no-check-gpg #LINE# work #URL#
chroot work /debootstrap/debootstrap --second-stage
cd work
tar -cvzf ../#TAG#.tgz .
cd ..
chmod a+rw #TAG#.tgz
rm -rf work
exit
##END


