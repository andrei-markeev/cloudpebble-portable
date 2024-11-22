## CloudPebble Portable

Reimplementation of CloudPebble to run locally. Easy way to create, debug and package Pebble apps and watchfaces.

While you can make CloudPebble work on your local machine, but it is heavy and contains a lot of stuff that is not needed for local development. Also, it's always a challenge to build it.

This project attempts to make it as thin as possible. Bare minimum dependencies. Distributed as a single executable based on [redbean web server](https://redbean.dev).

### Usage

Download the `cloudpebble-portable.com` executable from Releases. Change directory to where your `appinfo.json` resides and run the executable from there. The browser will pop up, showing CloudPebble interface, and your files in there.

### Development

Make changes to source code and run `./build.sh` to build it. Resulting executable will be created in the `dist` folder.