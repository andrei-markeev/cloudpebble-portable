## CloudPebble Portable

Simplified reincarnation of CloudPebble. Create, debug and package Pebble apps and watchfaces.

It doesn't have users, registration, authentication. Github integration removed. Files are picked up from the file system
contextually, so you can edit only one Pebble app project at a time.

CloudPebble Portable is aiming to reduce amount of dependencies as much as possible. Some dependencies are removed.
Remaining dependencies are packaged in. The application is distributed as a single executable based on [redbean web server](https://redbean.dev).

### Status

**Work in progress**. Not ready yet.

### Usage

Download the `cloudpebble-portable.com` executable from **Releases**. Change directory to where your `appinfo.json` resides and run the executable from there. The browser will pop up, showing CloudPebble interface, and your files in there.

### Development

Download redbean server and zip tool from https://redbean.dev/ and put them into `base` folder.

Run `./build.sh`. Resulting executable will be created in the `dist` folder.

Put some Pebble watchapp or watchface files into the same folder and run.

I usually do `./build.sh && cd dist && ./cloudpebble-portable.com && cd ..` so that it builds and starts the server right away.
Then test it by navigating to `http://localhost:8080`. Then if we made some more changes and need to refresh, `Ctrl+D` and run same command again.