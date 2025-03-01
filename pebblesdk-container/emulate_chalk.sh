#!/bin/sh

/pebble/qemu/bin/qemu-system-arm -rtc base=localtime -s \
    -serial null -serial tcp::12344,server,nowait -serial tcp::12345,server,nowait \
    -monitor tcp::12346,server,nowait -machine pebble-s4-bb -cpu cortex-m4 \
    -pflash /pebble/sdk3/pebble/chalk/qemu/qemu_micro_flash.bin \
    -pflash /pebble/sdk3/pebble/chalk/qemu/qemu_spi_flash.bin \
    -vnc :0,websocket=5901
