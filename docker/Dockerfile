ARG OSLINE=ubuntu
ARG OSVERSION=bionic
FROM ${OSLINE}:${OSVERSION}
ARG DEVENV=false
ARG UID
ARG GID
ARG USER
RUN apt-get update && apt-get install -y build-essential gettext git-core gpsd gpsd-clients libgps-dev wx-common libwxgtk3.0-dev libglu1-mesa-dev libgtk2.0-dev wx3.0-headers libbz2-dev libtinyxml-dev libportaudio2 portaudio19-dev libcurl4-openssl-dev libexpat1-dev libcairo2-dev libarchive-dev liblzma-dev libexif-dev libelf-dev libsqlite3-dev lsb-release software-properties-common libssl-dev gdb psmisc lsof


RUN groupadd -g $GID dev || echo group exists
RUN useradd -m -u $UID -g $GID $USER && apt-get install -y sudo \
    && echo $USER ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USER \
	&& chmod 0440 /etc/sudoers.d/$USER
RUN curl https://apt.kitware.com/keys/kitware-archive-latest.asc 2>/dev/null | gpg --dearmor - | tee /etc/apt/trusted.gpg.d/kitware.gpg >/dev/null &&\
	apt-add-repository 'deb https://apt.kitware.com/ubuntu/ bionic main' && \
	apt -y update && \
	apt -y install cmake 
CMD /bin/bash



USER $USER

