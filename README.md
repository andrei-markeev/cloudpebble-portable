## CloudPebble Portable

Simplified reincarnation of CloudPebble. Create, debug and package Pebble apps and watchfaces.

CloudPebble Portable is aiming to be small and self-contained. The application is distributed as a single executable based on [redbean web server](https://redbean.dev). The size is ~10MB at the moment, but in order to compile your watch app, it will need to download additional ~75MB archive, which unpacks to ~250MB (this is still very small comparing to any other option, e.g. available Docker images are almost 1GB _archived_).

### Status

**Work in progress**. Not ready yet.

- [x] 🟢 Editing source files works: you can create, edit, rename, delete, etc.
- [x] 🟢 Editing resources works
- [ ] 🔴 Code completion doesn't work
- [ ] 🟡 Compilation works partially:
    - [ ] 🟡 on Windows (via WSL and chroot)
        - [x] 🟢 Pebble C SDK
        - [x] 🟢 PebbleJS
        - [ ] 🔴 Pebble Package
        - [ ] 🔴 RockyJS
- [ ] 🔴 Emulator doesn't work
- [ ] 🔴 Dependencies management not implemented yet
- [ ] 🔴 Project settings not implemented yet

### Usage

Download the `cloudpebble-portable.com` executable from **Releases**. Drop it into your watch app folder (i.e. where your `appinfo.json` or `package.json` resides) and run. The browser will pop up, showing CloudPebble interface.

### Development

Run `./init.sh` (one-time): it downloads redbean server and zip tool binaries from https://redbean.dev/ and puts them into `base` folder.

Run `./build.sh`. It adds the source files into redbean executable. Result will appear in the `dist` folder.

Put some Pebble watchapp or watchface files into the same folder and run.

I usually do `cd dist` and then `../build.sh && ./cloudpebble-portable.com` from there.
Then test it by navigating to `http://localhost:8080`. Then if we made some more changes and need to refresh, `Ctrl+D` and run same command again.