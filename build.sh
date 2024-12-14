#!/bin/sh

set -xe

cd "$(dirname "$0")"

mkdir -p dist
rm dist/cloudpebble-portable.com || true

cp base/redbean dist/cloudpebble-portable.com
cd src
../base/zip -r ../dist/cloudpebble-portable.com .init.lua .lua .templates *
