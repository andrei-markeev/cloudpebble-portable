FROM python:2.7.18-slim-buster AS build

RUN apt-get update && apt-get install -y \
  binutils make gcc curl git \
  libglib2.0-dev libpixman-1-dev libfdt-dev gnutls-dev

ENV QEMU_VERSION 2.5.2-pebble4
  
RUN mkdir /qemu && cd /qemu && \
  curl -L https://github.com/iSevenDays/pebble_qemu/archive/v${QEMU_VERSION}.tar.gz | tar xz --strip 1 && \
  ./configure \
	--extra-ldflags=-g \
    --enable-debug --disable-werror --target-list="arm-softmmu" \
	&& \
  make clean && \
  make -j4

RUN git clone https://github.com/pebble/pypkjs.git --depth 1 --branch master --recursive
RUN rm -rf /pypkjs/.git

RUN pip install -r /pypkjs/requirements.txt

RUN rm -rf /pypkjs/pypkjs/PyV8/darwin64 && \
    rm -rf /pypkjs/pypkjs/PyV8/linux32

RUN curl -o /tmp/arm-cs-tools.tar https://cloudpebble-vagrant.s3.amazonaws.com/arm-cs-tools-stripped.tar && \
tar -xf /tmp/arm-cs-tools.tar -C / && rm /tmp/arm-cs-tools.tar

ENV SDK_THREE_VERSION=4.3

RUN mkdir /sdk3 && \
  curl -L "https://github.com/aveao/PebbleArchive/raw/master/SDKCores/sdk-core-$SDK_THREE_VERSION.tar.bz2" | \
  tar --strip-components=1 -xj -C /sdk3

RUN pip install -r /sdk3/requirements.txt

RUN mkdir /pebblejs && curl -Ls https://github.com/pebble/pebblejs/archive/refs/heads/master.tar.gz | \
  tar xz --strip 1 -C /pebblejs

RUN find / -name *.pyc | xargs rm

ENTRYPOINT [ "sh" ]

FROM python:2.7.18-slim-buster AS runtime

RUN apt-get update && apt-get install -y libglib2.0 libpixman-1-0 libfdt-dev libfreetype6 bzip2 \
  && apt-get remove -y python3.7 mono-runtime libicu63 && apt-get autoremove -y \
  && apt-get autoclean -y && apt-get clean -y

RUN mkdir -p /pebble/qemu/bin
RUN mkdir -p /pebble/qemu/pc-bios/keymaps
COPY --from=build /qemu/arm-softmmu/qemu-system-arm /pebble/qemu/bin/
COPY --from=build /qemu/pc-bios/keymaps/en-us /pebble/qemu/pc-bios/keymaps/
RUN rm -rf /usr/local/lib/python2.7/site-packages
COPY --from=build /usr/local/lib/python2.7/site-packages /usr/local/lib/python2.7/site-packages
COPY --from=build /pypkjs /pebble/pypkjs
RUN mkdir /pebble/pypkjs/data
COPY --from=build /arm-cs-tools /pebble/arm-cs-tools
COPY --from=build /sdk3 /pebble/sdk3
COPY --from=build /pebblejs /pebble/pebblejs
COPY ./*.sh /pebble/

ENTRYPOINT [ "sh" ]
