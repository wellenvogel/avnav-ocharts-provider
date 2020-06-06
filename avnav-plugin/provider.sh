#! /bin/sh
PDIR=`dirname $0`
exec xvfb-run -a -s "-screen 0 512x512x24" $PDIR/AvnavOchartsProvider $*
