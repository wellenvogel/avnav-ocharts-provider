#! /bin/sh
while [ 1 = 1 ] ; do
	x=`date +'%Y/%m/%d-%H:%M:%S'`
	echo "$x `ps -e -o pid,rss,cmd | grep Xvfb| grep -v grep`"
	echo "$x `ps -e -o pid,rss,cmd | grep AvnavOchartsProvider| grep -v -e grep -e xvfb-run`"
	sleep 1
done
