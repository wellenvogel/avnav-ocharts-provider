#! /bin/bash
cat /etc/group | grep ':1000:' || groupadd -g 1000 andreas
id -u andreas || useradd -m -u 1000 -g 1000 andreas
