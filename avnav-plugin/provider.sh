#! /bin/sh
PDIR=`dirname $0`
TESTSCRIPT=forward.py
PIPE=/tmp/AVNAV_PIPE
cd $PDIR
#uncomment the next line to get core files
#ulimit -c unlimited
if [ -f $TESTSCRIPT ] ; then
    echo "testscript $TESTSCRIPT found, using it"
    ./$TESTSCRIPT $PIPE /tmp/OCPN_PIPEX &
    exec env AVNAV_TEST_PIPE=$PIPE xvfb-run -a -s "-screen 0 512x512x24" $PDIR/AvnavOchartsProvider $*
else
    exec xvfb-run -a -s "-screen 0 512x512x24" $PDIR/AvnavOchartsProvider $*
fi    
