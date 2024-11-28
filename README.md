## CloudPebble Portable

Simplified reincarnation of CloudPebble. Create, debug and package Pebble apps and watchfaces.

It doesn't have users, registration, authentication. Github integration removed. Files are picked up from the file system
contextually, so you can edit only one Pebble app project at a time.

CloudPebble Portable is aiming to reduce amount of dependencies as much as possible. Some dependencies are removed.
Remaining dependencies are packaged in. The application is distributed as a single executable based on [redbean web server](https://redbean.dev).

### Status

**Work in progress**. Not ready yet.

- Editing source files works: you can create, edit, rename, delete, etc.
- Editing resources works partially, some scenarios don't work
- Code completion doesn't work
- Compilation works partially:
    - on Windows via WSL and chroot: C SDK and PebbleJS projects are currently supported
- Emulator doesn't work

### Usage

Download the `cloudpebble-portable.com` executable from **Releases**. Change directory to where your `appinfo.json` resides and run the executable from there. The browser will pop up, showing CloudPebble interface, and your files in there.

### Development

Run `./init.sh` (one-time): it download redbean server and zip tool binaries from https://redbean.dev/ and puts them into `base` folder.

Run `./build.sh`. Resulting executable will be created in the `dist` folder.

Put some Pebble watchapp or watchface files into the same folder and run.

After initial build, I usually do `cd dist` and then `../build.sh && ./cloudpebble-portable.com` from there.
Then test it by navigating to `http://localhost:8080`. Then if we made some more changes and need to refresh, `Ctrl+D` and run same command again.