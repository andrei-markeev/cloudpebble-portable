## CloudPebble Portable

Simplified reincarnation of CloudPebble. Create, debug and package Pebble apps and watchfaces.

CloudPebble Portable is aiming to be small and self-contained. The application is distributed as a single executable based on [redbean web server](https://redbean.dev). The size is ~10MB at the moment, but in order to compile your watch app, it will need to download additional ~90MB archive, which unpacks to ~280MB (this is still quite small comparing to other options, e.g. available Docker images are almost 1GB _compressed_).

### Status

**Work in progress**. Not ready yet.

- [x] 🟢 Editing source files works: you can create, edit, rename, delete, etc.
- [x] 🟢 Editing resources works
- [ ] 🟡 Code completion works partially:
    - [ ] 🔴 Code completion for C
    - [x] 🟢 Code completion for JS
- [ ] 🟡 Compilation works partially:
    - [ ] 🟡 on Windows (via WSL and chroot)
        - [x] 🟢 Pebble C SDK
        - [x] 🟢 PebbleJS
        - [ ] 🔴 Pebble Package
        - [ ] 🔴 RockyJS
    - [ ] 🔴 on MacOS
    - [ ] 🔴 on Linux
- [ ] 🟡 Emulator works partially:
    - [x] 🟢 on Windows (via WSL and chroot)
    - [ ] 🔴 on MacOS
    - [ ] 🔴 on Linux
- [x] 🟢 Connection to phone works
- [x] 🟢 Timeline UI (manual pin management and websync) works
- [ ] 🔴 Dependencies management UI not implemented yet
- [x] 🟢 Project settings UI works

### Usage

Download the `cloudpebble-portable.com` executable from **Releases**. Drop it into your watch app folder (i.e. where your `appinfo.json` or `package.json` resides) and run. The browser will pop up, showing CloudPebble interface.

### Development

Run `./init.sh` (one-time): it downloads redbean server and zip tool binaries from https://redbean.dev/ and puts them into `base` folder.

Run `./build.sh`. It adds the source files into redbean executable. Result will appear in the `dist` folder.

Then you can put some Pebble watchapp or watchface project into the dist folder, cd there and run `./cloudpebble-portable.com`.

I usually do `cd dist` and then `../build.sh && ./cloudpebble-portable.com` from there.
Then test it by navigating to `http://localhost:8080`. Then if we made some more changes and need to refresh, `Ctrl+D` and run same command again.