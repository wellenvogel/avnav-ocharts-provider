2020/04/10

First version of ocharts-provider

1. create an empty dir and copy AvnavOchartsProvider and opencpn.conf there
2. have oesenc-pi installed
3. have X display set (you can use Xvfb - better performance as with e.g. tightVNC)
4. start with
    ./AvnavOchartsProvider -s 3 -l provider.log  -t 5   -d 10 /usr/lib/opencpn/ /usr/share/opencpn/  . 8082   path-to-my-charts
    Parameters:
        -s 3    : scaling - higher values give more details on lower zoom levels, 1 is default
        -t 5    : use 5 threads for http processing (default: 4)
        -d 10 : debug level (1 is default)
        -l log : filename for log file (default: provider.log)
    Position parameters:
    1. the directory to be searched for OpenCPN plugins
    2. the directory for s57data
    3. the directory where the opencpn.cfg is located (must be writable)
    4. the HTTP port
    5.-x. list of chart files or directories of oesenc charts
    
5. Wait till you get
started HTTP server on port 8082
waiting for ENTER to stop

6. adapt oesenc1.xml for the correct IP and port and upload the chart source to AvNav
7. if charts are not loaded (will complain at the end) - check the log file. Typical problem: if OpenCPN is running it has problems to connect oeserverd. Just kill oeserverd and try again.

