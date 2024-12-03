set -xe

PATH=/pebble/arm-cs-tools/bin:$PATH

rm -rf /pebble/assembled
mkdir -p /pebble/assembled
mkdir -p /pebble/assembled/resources/fonts
mkdir -p /pebble/assembled/resources/images
mkdir -p /pebble/assembled/resources/data
cd /pebble/assembled
cp -r /pebble/pebblejs/* .
cp -r /pebble/app/* .

python /pebble/sdk3/pebble/waf configure build