function BlobDbService(pack, unpack) {
    var db = {
        Test: 0,
        Pin: 1,
        App: 2,
        Reminder: 3,
        Notification: 4,
        AppGlance: 11
    };

    var legacy_sources = {
        Email: 0,
        SMS: 1,
        Facebook: 2,
        Twitter: 3
    }
    var source_map = {
        [legacy_sources.Twitter]: 6,
        [legacy_sources.Email]: 19,
        [legacy_sources.Facebook]: 11,
        [legacy_sources.SMS]: 45,
    }
    var notification_types = {
        Notification: 1,
        Pin: 2,
        Reminder: 3
    }
    var action_types = {
        AncsDismiss: 0x01,
        Generic: 0x02,
        Response: 0x03,
        Dismiss: 0x04,
        HTTP: 0x05,
        Snooze: 0x06,
        OpenWatchapp: 0x07,
        Empty: 0x08,
        Remove: 0x09,
        OpenPin: 0x0a
    }

    this.prepareNotification = function(subject, message, sender = "", source = undefined) {
        var encoder = new TextEncoder('utf-8');
        var attributes_count = 3;
        // attribute format: id(uint8) length(uint16) content(uint8array)
        var attributes = 
            pack('<BHS', [0x01, encoder.encode(sender).length, sender])
            .concat(pack('<BHI', [0x04, 4, source !== undefined ? source_map[source] : 1]))
            .concat(pack('<BHS', [0x02, encoder.encode(subject).length, subject]));
        if (message) {
            attributes = attributes.concat(pack('<BHS', [0x03, encoder.encode(message).length, message]));
            attributes_count++;
        }

        var itemid = _.UUID.v4()

        var actions_count = 1;
        var dismiss_attribute = pack('<BHS', [0x01, "Dismiss".length, "Dismiss"]);
        // action format: id(uint8) type(uint8) attr_count(uint8) attrs
        var actions = pack('<BBB', [0, action_types.Dismiss, 1]).concat(dismiss_attribute);

        var itemid_packed = pack('<U', [itemid]);
        var notification = itemid_packed.concat(pack('<UIHBHBHBB', [
            '00000000-0000-0000-0000-000000000000',
            Math.floor(Date.now() / 1000), // timestamp
            0, // duration
            notification_types.Notification,
            0, // flags
            1, // layout
            attributes.length + actions.length, // data length
            attributes_count,
            actions_count
        ])).concat(attributes).concat(actions);

        var randomToken = Math.floor(Math.random()* 0xffff);

        return pack('<BHB', [0x01, randomToken, db.Notification])
            .concat(pack('<B', [itemid_packed.length])).concat(itemid_packed)
            .concat(pack('<H', [notification.length])).concat(notification);
    }
}

function AppMessageService(pack, unpack) {
    // Message format:
    //
    // endpoint Uint16 = APPLICATION_MESSAGE (0x30)
    //    command Uint8
    //    transaction_id Uint8
    //    data
    // 
    // command=0x01 => data=AppMessagePush
    //    uuid = UUID()
    //    count = Uint8()
    //    dictionary = AppMessageTuple[] (little-endian!)
    //        key = Uint32()
    //        type = Uint8()
    //            ByteArray = 0
    //            CString = 1 (zero-terminated)
    //            Uint = 2
    //            Int = 3
    //        length = Uint16()
    //        data = BinaryArray(length=length)
    //
    // command=0xff => AppMessageACK (empty)
    // command=0x7f => AppMessageNACK (empty)

    var VALUE_TYPES = {
        ByteArray: 0,
        CString: 1,
        UInt: 2,
        Int: 3
    }

    this.parseTuples = function(data) {
        var intkey_to_strkey = {};
        for (var [strkey, intkey] of Object.entries(CloudPebble.ProjectInfo.parsed_app_keys))
            intkey_to_strkey[intkey] = strkey;

        // the message is parsed until "count" field
        var result = {};
        var [count] = unpack("B", data);
        data = data.subarray(1);
        for (var i = 0; i < count; i++) {
            var [intkey, type, len] = unpack("<IBH", data);
            data = data.subarray(4 + 1 + 2);
            var strkey = intkey_to_strkey[intkey];
            if (type === VALUE_TYPES.Int || type === VALUE_TYPES.UInt)
                result[strkey] = unpack("<i", data)[0];
            else if (type === VALUE_TYPES.CString)
                if (len === 1)
                    result[strkey] = ""
                else
                    result[strkey] = unpack("S" + (len - 1), data)[0];
            else if (type === VALUE_TYPES.ByteArray)
                result[strkey] = data.subarray(0, len);
            else {
                console.error("Invalid tuple:", new Uint8Array(data))
                throw new Error("Failed to parse appmessage!");
            }
            data = data.subarray(len);
        }
        return result;
    }

    this.prepare = function(messageDict, transactionId) {
        const kvpairs = Object.entries(messageDict);

        let message = pack('BBUB', [0x01, transactionId, CloudPebble.ProjectInfo.app_uuid, kvpairs.length]);

        for (const [k, v] of kvpairs) {
            const messageKey = CloudPebble.ProjectInfo.parsed_app_keys[k];
            if (messageKey == null)
                throw new Error("Unknown message key '" + k + "'");
            if (typeof v !== 'string' && typeof v !== 'number' && !Array.isArray(v))
                throw new Error("Unsupported value type " + (typeof v) + " for app message key '" + k + "'");
            if (Array.isArray(v) && !(v instanceof Uint8Array)) {
                for (var i = 0; i < v.length; i++) {
                    if (typeof v[i] !== "number" || v[i] < 0 || v[i] > 255)
                        throw new Error("Unexpected value in a byte array: " + v[i] + "! Values should be numbers between 0 and 255.");
                }
            }
            if (typeof v === 'string')
                message = message.concat(pack('<IBHS', [messageKey, VALUE_TYPES.CString, v.length + 1, v + '\0']));
            else if (typeof v === 'number') {
                message = message.concat(pack('<IBHi', [messageKey, VALUE_TYPES.Int, 4, v]));
            } else
                message = message.concat(pack('<IBH', [messageKey, VALUE_TYPES.ByteArray, v.length]), v);
        }

        return message;
    }
}

function JsRuntime(pack, unpack, trigger, send_message, open_config_page, versionInfo) {

    var state = {
        handlers: {},
        ready: false,
        transactionId: 0,
        callbacks: {},
    };
    this.clear = function() {
        state.handlers = {};
        state.ready = false;
        state.transactionId = 0;
        state.callbacks = {};
    }

    var scriptStart;
    var appMessageService, blobDbService;
    var pebbleRuntime, consoleRuntime, localStorageRuntime;
    this.init = function(appJsScript) {
        if (!appJsScript) {
            console.error('Application javascript was not downloaded!');
            return;
        }
        if (!localStorageRuntime) {
            var exceptions = [
                'Object', 'Number', 'String', 'Boolean', 'RegExp', 'Date', 'Math', 'Array', 'JSON',
                'Function', 'parseFloat', 'parseInt', 'undefined', 'eval', 'NaN', 'isNaN',
                'decodeURI', 'decodeURIComponent', 'encodeURI', 'encodeURIComponent', 'escape', 'unescape',
                'XMLHttpRequest', 'Pebble', 'console', 'localStorage'
            ];
            scriptStart = '"use strict";var ';
            for (var p of Object.getOwnPropertyNames(window))
                if (isNaN(+p) && exceptions.indexOf(p) === -1)
                    scriptStart += p + ",";
            scriptStart += "window;"

            appMessageService = new AppMessageService(pack, unpack);
            blobDbService = new BlobDbService(pack, unpack);
            pebbleRuntime = new PebbleRuntime(state, appMessageService, blobDbService, send_message, open_config_page, versionInfo);
            consoleRuntime = new ConsoleRuntime(trigger);
            localStorageRuntime = new LocalStorageRuntime();
        }

        new Function('Pebble', 'console', 'localStorage', 'XMLHttpRequest', scriptStart + appJsScript)
            .call({}, pebbleRuntime, consoleRuntime, localStorageRuntime, ProxiedXMLHttpRequest);

        state.ready = true;

        for (var handler of state.handlers['ready'])
            handler.call({});
    }

    this.raiseCallback = function(transactionId, isSuccess, args) {
        return state.callbacks[transactionId]?.[isSuccess ? 0 : 1]?.apply({}, args);
    }

    this.handleAppMessage = function(data) {
        var handlers = state.handlers['appmessage'];
        if (!handlers || handlers.length === 0)
            return;

        var result = appMessageService.parseTuples(data);
        this.handle('appmessage', [{ payload: result }]);
    }

    this.handle = function(eventName, args) {
        var handlers = state.handlers[eventName.toLowerCase()];
        if (!handlers || handlers.length === 0)
            return;
        for (var handler of handlers)
            handler.apply({}, args);
    }

}

function PebbleRuntime(state, appMessageService, blobDbService, send_message, open_config_page, versionInfo) {
    function ensureReady() {
        if (!state.ready)
            throw new Error("Can't interact with the watch before the ready event is fired.");
    }

    this.sendAppMessage = function(messageDict, onSuccess, onFailure) {
        ensureReady();

        var message = appMessageService.prepare(messageDict, state.transactionId);

        state.callbacks[state.transactionId] = [onSuccess, onFailure];
        state.transactionId = (state.transactionId + 1) & 0xFF;

        send_message('APPLICATION_MESSAGE', message);

    }
    this.showSimpleNotificationOnPebble = function (title, message) {
        ensureReady();
        var packet = blobDbService.prepareNotification(title, message);
        send_message('BLOBDB', packet);
    }
    this.getAccountToken = function () {
        ensureReady();
        return "0123456789abcdef0123456789abcdef";
    }
    this.getWatchToken = function () {
        ensureReady();
        return "0123456789abcdef0123456789abcdef";
    }
    this.addEventListener = function (eventName, handler) {
        eventName = (""+eventName).toLowerCase();
        if (!state.handlers[eventName])
            state.handlers[eventName] = [];
        state.handlers[eventName].push(handler);
    }
    this.removeEventListener = function (eventName, handler) {
        eventName = (""+eventName).toLowerCase();
        if (state.handlers[eventName]) {
            for (var i = 0; i < state.handlers[eventName].length; i++) {
                if (state.handlers[eventName][i] === handler) {
                    state.handlers[eventName].splice(i, 1);
                    break;
                }
            }
        }
    }
    this.openURL = function (url) {
        return open_config_page("" + url);
    }

    function poll() {
        var authWindow = null;
        var spamInterval = setInterval(function () {
            if (authWindow.location && authWindow.location.host) {
                $(authWindow).off();
                clearInterval(spamInterval);
                console.log("there!");
                authWindow.postMessage('hi', '*');
                $(window).one('message', function (event) {
                    var queryString = event.originalEvent.data;
                    console.log('got:', queryString);
                    var params = new URLSearchParams(queryString);
                    if (params.has('success')) {
                        mAuthenticated = 1;
                        syncFromWeb();
                    } else if (params.has('error'))
                        setStatus(false, params.get('error'));
                    authWindow.close();
                });
                
            } else if (authWindow.closed) {
                console.log('it closed.');
                clearInterval(spamInterval);
                $(window).off('message');
            }
        }, 1000);
    }

    var timelineToken;
    this.getTimelineToken = function (onSuccess, onFailure) {
        if (timelineToken) {
            onSuccess.call({}, timelineToken)
            return;
        }
        Ajax.Get('/api/get-timeline-token.lua?uuid=' + CloudPebble.ProjectInfo.app_uuid)
            .then(function(data) {
                timelineToken = data.token;
                onSuccess?.call({}, data.token);
            })
            .catch(function(err) {
                if (err.message === 'Rebble authentication required') {
                    CloudPebble.Prompts.Confirm(
                        gettext("Authentication required"),
                        gettext("Your application is trying to request a timeline token. Please log in to Rebble in order to proceed."),
                        function() {
                            authWindow = window.open(
                                "https://auth.rebble.io/oauth/authorise?response_type=code&client_id=b576399e9d1fdaa8e666a4dffbbdd1&scope=profile&redirect_uri=http://localhost:60000/",
                                "rebble_auth",
                                "width=375,height=567"
                            );
                            poll();
                        },
                        function() {
                            onFailure?.call({}, "Failed to request a timeline token. User cancelled authentication to Rebble.")
                        }
                    );
                } else
                    onFailure?.call({}, err.message)
            });
    }
    this.timelineSubscribe = function () {
        ensureReady();
        throw new Error("Rebble doesn't support shared pins.");
    }
    this.timelineUnsubscribe = function () {
        ensureReady();
        throw new Error("Rebble doesn't support shared pins.");
    }
    this.timelineSubscriptions = function () {
        ensureReady();
        throw new Error("Rebble doesn't support shared pins.");
    }
    this.getActiveWatchInfo = function () {
        return versionInfo;
    }
    this.appGlanceReload = function () {
        ensureReady();
        // TODO
    }
}

function ConsoleRuntime(trigger) {
    function captureStackTrace() {
        const oldStackTrace = Error.prepareStackTrace;
        try {
            Error.prepareStackTrace = (err, t) => t;
            Error.captureStackTrace(this);
            return this.stack;
        } finally {
            Error.prepareStackTrace = oldStackTrace;
        }
    }
    function createLogFunc(level) {
        return function() {
            var st = captureStackTrace();
            var s = '';
            for (var i = 0; i < arguments.length; i++) {
                if (i > 0)
                    s += ' ';
                s += arguments[i];
            }
            trigger("app_log", level, 'pebble-js-app.js', st[2].getLineNumber() - 2, s);
        }
    }
    return {
        log: createLogFunc(100),
        info: createLogFunc(100),
        warn: createLogFunc(50),
        error: createLogFunc(10)
    }
}

function LocalStorageRuntime() {
    var storageKey = 'app-' + CloudPebble.ProjectInfo.app_uuid;
    this.getItem = function(key) {
        const storage = JSON.parse(localStorage.getItem(storageKey) || "{}");
        return key in storage ? storage[key] : null;
    };
    this.setItem = function(key, value) {
        const storage = JSON.parse(localStorage.getItem(storageKey) || "{}");
        storage[key] = value;
        const updated = JSON.stringify(storage);
        localStorage.setItem(storageKey, updated);
    };
    this.removeItem = function(key) {
        const storage = JSON.parse(localStorage.getItem(storageKey) || "{}");
        storage[key] = undefined;
        const updated = JSON.stringify(storage);
        localStorage.setItem(storageKey, updated);
    };
    this.clear = function() {
        localStorage.removeItem(storageKey);
    };
    // TODO: add more methods
}

function ProxiedXMLHttpRequest() {

    this.UNSENT = 0;
    this.OPENED = 1;
    this.HEADERS_RECEIVED = 2;
    this.LOADING = 3;
    this.DONE = 4;

    this.readyState = self.UNSENT

    var xhr = new XMLHttpRequest();

    this.open = (method, url, async = true, user = null, password = null) => {
        xhr.open("POST", "/api/make-request.lua", async);
        xhr.setRequestHeader('X-Url', url);
        xhr.setRequestHeader('X-Method', method);
        if (user != null) {
            xhr.setRequestHeader('X-Authorization', btoa(user + ":" + password));
        }
    }

    this.setRequestHeader = (header, value) => xhr.setRequestHeader('X-CPP-' + header, value);

    this.send = (data) => {
        if (this.onreadystatechange) xhr.onreadystatechange = this.onreadystatechange.bind(this);
        if (this.ontimeout) xhr.ontimeout = this.ontimeout.bind(this);
        if (this.onloadstart) xhr.onloadstart = this.onloadstart.bind(this);
        if (this.onloadend) xhr.onloadend = this.onloadend.bind(this);
        if (this.onprogress) xhr.onprogress = this.onprogress.bind(this);
        if (this.onerror) xhr.onerror = this.onerror.bind(this);
        if (this.onabort) xhr.onabort = this.onabort.bind(this);
        xhr.responseType = this.responseType;
        xhr.onload = (e) => {
            this.readyState = xhr.readyState;
            this.status = xhr.status;
            this.statusText = xhr.statusText;
            this.response = xhr.response;
            this.responseText = xhr.response;
            if (this.onload)
                this.onload(e);
            if (this.onloadend)
                this.onloadend(e);
            if (this.onreadystatechange)
                this.onreadystatechange(e);
        };
        xhr.send(data)
    }

    this.overrideMimeType = (mimetype) => xhr.overrideMimeType(mimetype);

    this.getResponseHeader = (header) => xhr.getResponseHeader(header);
    this.getAllResponseHeaders = () => xhr.getAllResponseHeaders();
    this.abort = () => xhr.abort();
}