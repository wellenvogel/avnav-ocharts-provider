# generate devenv for OpenCPN

_generate docker containers for developing OpenCPN_

Based on pi-gen for the raspberry part


## Dependencies

The tool runs on Debian/Ubuntu based operating systems.
It requires docker.

## Handling

There are 2 build scripts:

build-devenv.sh: build a docker container for ubuntu/debian 

build-pi-cross.sh: build a docker container with a pi devenv at /pi-cross

Important Options:<br>
-r osversion: the debian/ubuntu version (default: bionic for normal, buster for pi)<br>
-l osline: (only build-devenv.sh) select debian|ubuntu (default: ubuntu)<br>
-d: (only build-devenv.sh): install netbeans + opencpn + oesenc-pi (will only work with ubuntu versions)

If you installed netbeans you still need to run the netbeans installer later as root with X. Call the installer in the /root folder.

There is a startcommand script that will start a devenv container with the necessary options to use it for development and debugging.

## Usage

To use the containers for building there is a buildscript (build.sh) in the provider directory.
Call it with -i imagename to use one of the created docker images. See the help of this script.

## Pi-gen
Refer to https://github.com/RPi-Distro/pi-gen for the configuration options for the pi-gen part.<br>
It has been slightly modified to omit copying of the base system and exporting any images.
