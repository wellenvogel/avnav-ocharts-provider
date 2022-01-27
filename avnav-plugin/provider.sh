#! /bin/sh
PDIR=`dirname $0`
PDIR=`readlink -f $PDIR`
TESTSCRIPT=$PDIR/forward.py
PIPE=/tmp/AVNAV_PIPE
ENVFILE=$PDIR/environment.txt
workdir=$PDIR
#uncomment the next line to get core files
#ulimit -c unlimited
if [ -f $ENVFILE ] ; then
    echo "$ENVFILE found, souring it"
    . $ENVFILE
fi
if [ "$AVNAV_PROVIDER_WORKDIR" != "" ] ; then
    if [ -d $AVNAV_PROVIDER_WORKDIR ] ; then
        workdir="$AVNAV_PROVIDER_WORKDIR"
    fi
fi
echo "working in $workdir"
cd $workdir
if [ -f $TESTSCRIPT ] ; then
    echo "testscript $TESTSCRIPT found, using it"
    $TESTSCRIPT $PIPE /tmp/OCPN_PIPEX &
    exec env AVNAV_TEST_PIPE=$PIPE xvfb-run -a -s "-screen 0 512x512x24" $PDIR/AvnavOchartsProvider $*
else
    exec xvfb-run -a -s "-screen 0 512x512x24" $PDIR/AvnavOchartsProvider $*
fi    
