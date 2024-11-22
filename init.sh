#!/bin/sh

set -xe

mkdir -p base

curl https://redbean.dev/redbean-3.0.0.com -o base/redbean-3.0.0.com
curl https://cosmo.zip/pub/cosmos/bin/zip -o base/zip

chmod +x base/redbean-3.0.0.com
chmod +x base/zip