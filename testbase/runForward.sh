#! /bin/sh
pdir=`dirname $0`
pdir=`readlink -f $pdir`
FW=$pdir/../../ocharts-provider-closed/test/forward.py
IP=/tmp/AVNAV_PIPE
OP=/tmp/OCPN_PIPEX

if [ ! -e "$IP" ] ; then
  echo "creating $IP"
  mkfifo $IP
fi
ex=`ps -ef | grep $IP | grep -v grep | awk '{print $2;}'`
if [ "$ex" != "" ] ; then
    kill $ex
fi
if [ -f "$FW" ] ; then
    cd $pdir
    echo "starting $FW $IP $OP"
    $FW $IP $OP 
else
    if [ ! -e $OP ] ; then
        echo "creating $OP"
        mkfifo $OP
    fi
    nohup cat $IP > $OP
fi        