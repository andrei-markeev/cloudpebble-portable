#!/bin/sh

/pebble/qemu/bin/qemu-system-arm -rtc base=localtime -s \
    -serial null -serial tcp::12344,server,nowait -serial tcp::12345,server,nowait \
    -monitor stdio -machine pebble-silk-bb -cpu cortex-m4 \
    -pflash /pebble/sdk3/pebble/aplite/qemu/qemu_micro_flash.bin \
    -mtdblock /pebble/sdk3/pebble/aplite/qemu/qemu_spi_flash.bin \
    -vnc :0,websocket=5901
