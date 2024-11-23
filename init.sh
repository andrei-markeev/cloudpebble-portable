#!/bin/sh

FIRMWARE_VERSION=4.3

set -xe

mkdir -p base

curl https://redbean.dev/redbean-3.0.0.com -o base/redbean-3.0.0.com
curl https://cosmo.zip/pub/cosmos/bin/zip -o base/zip

mkdir -p base/qemu-tintin-images
curl -L https://github.com/pebble/qemu-tintin-images/archive/v${FIRMWARE_VERSION}.tar.gz | tar xz --strip 1 -C base

chmod +x base/redbean-3.0.0.com
chmod +x base/zip