#!/bin/bash

set -xe

ROOTFS_DIR=dist/.pebble/pebblesdk-container/rootfs

rm -rf dist/.pebble
mkdir -p dist/.pebble
cp -r base/pebblesdk-container dist/.pebble
mkdir $ROOTFS_DIR/pebble/app
cp -r dist/* $ROOTFS_DIR/pebble/app/
rm $ROOTFS_DIR/pebble/app/cloudpebble-portable.com

#wsl --user root -- chroot $ROOTFS_DIR sh -c pebble/compile_app.sh
