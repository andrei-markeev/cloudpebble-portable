#!/bin/sh

set -xe

cd "$(dirname "$0")"

mkdir -p dist
rm dist/cloudpebble-portable.com || true

cp base/redbean-3.0.0.com dist/cloudpebble-portable.com
cd src
../base/zip -r ../dist/cloudpebble-portable.com *
