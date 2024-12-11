function JsRuntime(appJsScript, pack, trigger, send_message, open_config_page) {

    var cleanState = {
        handlers: {},
        ready: false,
        transactionId: 0,
        callbacks: {},
    };
    var state = Object.assign({}, cleanState);
    this.clear = function() {
        state = Object.assign({}, cleanState);
    }

    var scriptStart, pebbleRuntime, consoleRuntime, localStorageRuntime;
    this.init = function() {
        if (!appJsScript) {
            console.error('Application javascript was not downloaded!');
            return;
        }
        if (!localStorageRuntime) {
            var exceptions = [
                'Object', 'Number', 'String', 'Boolean', 'RegExp', 'Date', 'Math', 'Array', 'JSON',
                'Function', 'parseFloat', 'parseInt', 'undefined', 'eval', 'NaN', 'isNaN',
                'decodeURI', 'decodeURIComponent',
                'XMLHttpRequest', 'Pebble', 'console', 'localStorage'
            ];
            scriptStart = '"use strict";var ';
            for (var p of Object.getOwnPropertyNames(window))
                if (isNaN(+p) && exceptions.indexOf(p) === -1)
                    scriptStart += p + ",";
            scriptStart += "window;"

            pebbleRuntime = new PebbleRuntime(state, pack, send_message, open_config_page);
            consoleRuntime = new ConsoleRuntime(trigger);
            localStorageRuntime = new LocalStorageRuntime();
        }

        new Function('Pebble', 'console', 'localStorage', scriptStart + appJsScript)
            .call({}, pebbleRuntime, consoleRuntime, localStorageRuntime);

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

        // the message is parsed until "count" field
        // TODO: convert appmessage to the js format and pass to the handler
    }

    this.handle = function(eventName, args) {
        var handlers = state.handlers[eventName.toLowerCase()];
        if (!handlers || handlers.length === 0)
            return;
        for (var handler of handlers)
            handler.apply({}, args);
    }

}

function PebbleRuntime(state, pack, send_message, open_config_page) {
    var VALUE_TYPES = {
        ByteArray: 0,
        CString: 1,
        UInt: 2,
        Int: 3
    }

    function ensureReady() {
        if (!state.ready)
            throw new Error("Can't interact with the watch before the ready event is fired.");
    }

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
    this.sendAppMessage = function(messageDict, onSuccess, onFailure) {
        ensureReady();

        const kvpairs = Object.entries(messageDict);

        let message = pack('BBUB', [0x01, state.transactionId, CloudPebble.ProjectInfo.app_uuid, kvpairs.length]);
        state.callbacks[state.transactionId] = [onSuccess, onFailure];
        state.transactionId = (state.transactionId + 1) & 0xFF;

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

        send_message('APPLICATION_MESSAGE', message);

    }
    this.showSimpleNotificationOnPebble = function () {
        
    }
    this.getAccountToken = function () {
        return "0123456789abcdef0123456789abcdef";
    }
    this.getWatchToken = function () {
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
    this.getTimelineToken = function () {
        
    }
    this.timelineSubscribe = function () {
    
    }
    this.timelineUnsubscribe = function () {
    
    }
    this.timelineSubscriptions = function () {
    
    }
    this.getActiveWatchInfo = function () {
    
    }
    this.appGlanceReload = function () {
    
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
            for (var i = 0; i < arguments.length; i++)
                s += arguments[i];
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
        return JSON.parse(localStorage.getItem(storageKey) || "{}")[key] || null;
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