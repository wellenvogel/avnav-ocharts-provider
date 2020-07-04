ARG OSLINE=ubuntu
ARG OSVERSION=bionic
FROM ${OSLINE}:${OSVERSION}
ARG DEVENV=false
ARG UID
ARG GID
ARG USER
RUN apt-get update && apt-get install -y build-essential cmake gettext git-core gpsd gpsd-clients libgps-dev wx-common libwxgtk3.0-dev libglu1-mesa-dev libgtk2.0-dev wx3.0-headers libbz2-dev libtinyxml-dev libportaudio2 portaudio19-dev libcurl4-openssl-dev libexpat1-dev libcairo2-dev libarchive-dev liblzma-dev libexif-dev libelf-dev libsqlite3-dev lsb-release software-properties-common libssl-dev

RUN groupadd -g $GID dev
RUN useradd -m -u $UID -g $GID $USER
CMD /bin/bash

RUN if [ "$DEVENV" = "true" ] ; then add-apt-repository ppa:opencpn/opencpn ${OSLINE} ${OSVERSION} && \
	apt-get update && \
	apt-get install -y oesenc-pi ; fi

RUN if [ "$DEVENV" = "true" ] ; then curl  https://adoptopenjdk.jfrog.io/adoptopenjdk/api/gpg/key/public | apt-key add - && \
	add-apt-repository --yes https://adoptopenjdk.jfrog.io/adoptopenjdk/deb/ && \
	apt update -y && \
	apt install -y adoptopenjdk-8-hotspot gdb && \
        cd /root && curl -o netbeans82.sh https://download.netbeans.org/netbeans/8.2/final/bundles/netbeans-8.2-cpp-linux-x64.sh && echo "run netbeans installer with x as root" ; else echo "DEVENV=$DEVENV" ; fi


USER $USER

