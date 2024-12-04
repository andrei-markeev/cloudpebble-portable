#!/bin/sh

bzip2 -d /pebble/sdk3/pebble/aplite/qemu/qemu_spi_flash.bin.bz2
bzip2 -d /pebble/sdk3/pebble/basalt/qemu/qemu_spi_flash.bin.bz2
bzip2 -d /pebble/sdk3/pebble/chalk/qemu/qemu_spi_flash.bin.bz2
bzip2 -d /pebble/sdk3/pebble/diorite/qemu/qemu_spi_flash.bin.bz2
bzip2 -d /pebble/sdk3/pebble/emery/qemu/qemu_spi_flash.bin.bz2

echo "nameserver 8.8.8.8" > /etc/resolv.conf
