#!/bin/sh

set -xe

PATH=/pebble/arm-cs-tools/bin:$PATH

cd /pebble/assembled
python /pebble/sdk3/pebble/waf configure build