/**
 * Created by katharine on 12/17/14.
 */

(function() {
    var sLoadedScripts = false;
    window.INCLUDE_URI = "";
    window.QEmu = function (platform, canvas, button_map) {
        var self = this;
        var mCanvas = $(canvas);
        var mToken = 'local';
        var mVNCPort = 5901;
        var mInstanceID = null;
        var mHost = 'localhost';
        var mRFB = null;
        var mSecure = false;
        var mPendingPromise = null;
        var mConnected = false;
        var mSplashURL = null;
        var mGrabbedKeyboard = false;
        var mPingTimer = null;
        var mPyPKJSPort = 5902;
        var mButtonMap = button_map;
        var mPlatform = platform;

        _.extend(this, Backbone.Events);

        function spawn() {
            if (!window.WebSocket) {
                return Promise.reject(new Error(gettext("You need a browser that supports websockets.")));
            }

            // TODO: handle progress

            var tz_offset = -(new Date()).getTimezoneOffset(); // Negative because JS does timezones backwards.
            return Ajax.Post('/api/launch-emulator.lua', { platform: mPlatform, token: USER_SETTINGS.token, tz_offset: tz_offset })
                .then(function (data) {
                    mVNCPort = data.vnc_ws_port;
                    mPyPKJSPort = data.pypkjs_port;

                    if (data.spawned)
                        return new Promise(function(resolve) { setTimeout(resolve, 2500) });
                });
        }

        var mKickInterval = null;

        function kickRFB() {
            if(!mRFB) {
                return;
            }
            mRFB.sendKey(XK_Shift_L);
        }

        var killPromise = null;
        function killEmulator() {
            if (!killPromise) {
                killPromise = Ajax.Post('/api/stop-emulator.lua').finally(function() {
                    killPromise = null;
                });
            }
            return killPromise;
        }

        function updateStateHandler(resolve, reject) {
            return function (rfb, state, oldstate, msg) {
                if (mPendingPromise) {
                    if (state == 'normal') {
                        mRFB.get_keyboard().ungrab();
                        setTimeout(function () {
                            resolve();
                            mPendingPromise = null;
                        }, 2000);
                        self.trigger('connected');
                        mKickInterval = setInterval(kickRFB, 2000); // By doing this we make sure it keeps updating.
                    } else if (state == 'failed' || state == 'fatal') {
                        reject(msg);
                    }
                }
                if (state == 'normal') {
                    mConnected = true;
                    switch (mPlatform) {
                        case 'aplite':
                            mRFB.get_display().resize(144, 168);
                            break;
                        case 'basalt':
                            mRFB.get_display().resize(148, 172);
                            break;
                        case 'chalk':
                            mRFB.get_display().resize(180, 180);
                            break;
                        case 'diorite':
                            mRFB.get_display().resize(144, 168);
                            break;
                        case 'emery':
                            mRFB.get_display().resize(200, 228);
                            break;
                    }
                }
                if (mConnected && state == 'disconnected') {
                    mConnected = false;
                    killEmulator();
                    clearInterval(mKickInterval);
                    clearInterval(mPingTimer);
                    self.trigger('disconnected');

                }
            }
        }

        function handleCanvasClick() {
            if(mGrabbedKeyboard) return true;
            setTimeout(function() {
                grabKeyboard();
                $(document).on('click', handleNonCanvasClick);
            }, 50);
            mGrabbedKeyboard = true;
            return true;
        }

        function handleNonCanvasClick(e) {
            var target = e.target;
            if($('#emulator-container').find(target).length) {
                return true;
            }
            $(document).off('click', handleNonCanvasClick);
            mGrabbedKeyboard = false;
            releaseKeyboard();
            return true;
        }

        function startVNC() {
            mCanvas.on('click', handleCanvasClick);
            return loadScripts().then(function() {
                Util.init_logging('warn');
                return new Promise(function(resolve, reject) {
                    mRFB = new RFB({
                        target: mCanvas[0],
                        encrypt: mSecure,
                        true_color: true, // Ideally this would be false, but qemu doesn't support that.
                        local_cursor: false,
                        shared: true,
                        view_only: false,
                        onUpdateState: updateStateHandler(resolve, reject)
                    });
                    window.rfb = mRFB;
                    mRFB.get_display()._logo = {
                        width: URL_BOOT_IMG[mPlatform].size[0],
                        height: URL_BOOT_IMG[mPlatform].size[1],
                        data: URL_BOOT_IMG[mPlatform].url
                    };
                    mRFB.get_display().clear();
                    mRFB.connect(mHost, mVNCPort);
                });
            });
        }

        function loadScripts() {
            if (sLoadedScripts) return Promise.resolve();
            return new Promise(function(resolve, reject) {
                console.log("loading vnc client...");
                Util.load_scripts(URL_VNC_INCLUDES);
                window.onscriptsload = function() {
                    console.log("vnc ready");
                    sLoadedScripts = true;
                    resolve();
                }
            });
        }

        function showLaunchSplash() {
            var img = new Image(URL_BOOT_IMG[mPlatform].size[0], URL_BOOT_IMG[mPlatform].size[1]);
            img.src = URL_BOOT_IMG[mPlatform].url;
            console.log('show launch splash', img.src);
            img.onload = function() {
                console.log("drawing", img.src);
                mCanvas[0].getContext('2d').drawImage(img, 0, 0);
                mSplashURL = mCanvas[0].toDataURL();
            };
        }

        function grabKeyboard() {
            console.log('emulator grabbed keyboard');
            $(document).keydown(handleKeydown);
            $(document).keyup(handleKeyup);
        }

        function releaseKeyboard() {
            console.log('emulator released keyboard');
            $(document).off('keyup', handleKeyup);
            $(document).off('keydown', handleKeydown);
        }

        var buttonMap = {
            37: Pebble.Button.Back,    // left arrow
            38: Pebble.Button.Up,      // up arrow
            39: Pebble.Button.Select,  // right arrow
            40: Pebble.Button.Down,    // down arrow
            87: Pebble.Button.Back,    // W
            69: Pebble.Button.Up,      // E
            68: Pebble.Button.Select,  // D
            67: Pebble.Button.Down     // C
        };

        var tapMap = {
            88: 0, // X
            89: 1, // Y
            90: 2  // X
        };

        function handleKeydown(e) {
            var button = buttonMap[e.keyCode];
            if(button === undefined) {
                handleKeypress(e);
                return;
            }
            e.preventDefault();
            SharedPebble.getPebble().then(function(pebble) {
                pebble.emu_press_button(button, true);
            });
        }

        function handleKeyup(e) {
            var button = buttonMap[e.keyCode];
            if(button === undefined) {
                return;
            }
            e.preventDefault();
            SharedPebble.getPebble().then(function(pebble) {
                pebble.emu_press_button(button, false)
            });
        }

        function handleKeypress(e) {
            var axis = tapMap[e.keyCode];
            if(axis === undefined) {
                return;
            }
            e.preventDefault();
            var direction = e.shiftKey ? -1 : 1;
            SharedPebble.getPebble().then(function(pebble) {
                pebble.emu_tap(axis, direction);
            });
        }

        this.connect = function() {
            if(mConnected) {
                return Promise.resolve();
            }
            if(mPendingPromise) {
                return mPendingPromise;
            }
            var resolvePending, rejectPending;
            mPendingPromise = new Promise((resolve, reject) => { resolvePending = resolve; rejectPending = reject });
            showLaunchSplash();
            var attemptsLeft = 10;
            function tryConnect() {
                spawn().then(function() {
                        return startVNC()
                    })
                    .then(function() {
                        resolvePending();
                    })
                    .catch(function(error) {
                        if (error.indexOf('1006') > -1 && attemptsLeft > 0) {
                            attemptsLeft--;
                            setTimeout(tryConnect, 2000)
                        } else
                            rejectPending(error)
                    });
            }
            tryConnect();
            return mPendingPromise;
        };

        this.disconnect = function() {
            if(!mConnected) {
                return;
            }
            mRFB.disconnect();
            return killEmulator()
                .then(function() {
                    console.log('killed emulator.');
                })
                .catch(function() {
                    console.warn('failed to kill emulator.');
                });
        };

        this.getWebsocketURL = function() {
            return (mSecure ? 'wss' : 'ws') + '://' + mHost + ':' + mPyPKJSPort + '/';
        };

        this.getToken = function() {
            return mToken;
        };

        this.getUUID = function() {
            return mInstanceID;
        };

        this.handleButton = function(button, down) {
            if(!mRFB) return;
            var buttonMap = {
                'up': Pebble.Button.Up,
                'select': Pebble.Button.Select,
                'down': Pebble.Button.Down,
                'back': Pebble.Button.Back
            };
            if(buttonMap[button] === undefined) {
                console.error("unknown button " + button);
                return;
            }
            SharedPebble.getPebble().then(function(pebble){
                pebble.emu_press_button(buttonMap[button], down);
            })
        };

        _.each(mButtonMap, function(element, button) {
            $(element).mousedown(function() {
                self.handleButton(button, true);
                $(document).one('mouseup', function() {
                    self.handleButton(button, false);
                })
            })
        });
    };
})();
