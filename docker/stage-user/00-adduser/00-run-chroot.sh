#! /bin/bash
cat /etc/group | grep ':100:' || groupadd -g 100 users
id -u andreas || useradd -m -u 1026 -g 100 andreas
