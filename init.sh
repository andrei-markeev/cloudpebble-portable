#!/bin/sh

set -xe

mkdir -p base

curl https://cosmo.zip/pub/cosmos/bin/redbean -o base/redbean
curl https://cosmo.zip/pub/cosmos/bin/zip -o base/zip

chmod +x base/redbean
chmod +x base/zip
