// @ts-check
var PebbleRuntimeState;
function PebbleRuntimeClear() {
    PebbleRuntimeState = {
        handlers: {},
        ready: false,
        transactionId: 0,
    }
}
PebbleRuntimeClear();

function PebbleRuntime(pack, send_message) {
    var VALUE_TYPES = {
        ByteArray: 0,
        CString: 1,
        UInt: 2,
        Int: 3
    }

    function ensureReady() {
        if (!PebbleRuntimeState.ready)
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
    //    dictionary = AppMessageTuple[]
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
    this.sendAppMessage = function(messageDict) {
        ensureReady();

        const kvpairs = Object.entries(messageDict);

        let message = pack('BBUB', [0x01, PebbleRuntimeState.transactionId, CloudPebble.ProjectInfo.app_uuid, kvpairs.length]);
        PebbleRuntimeState.transactionId = (PebbleRuntimeState.transactionId + 1) & 0xFF;

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
                message = message.concat(pack('IBHS', [messageKey, VALUE_TYPES.CString, v.length + 1, v + '\0']));
            else if (typeof v === 'number') {
                let type, len, format;
                if (v >= 0 && v <= 255) {
                    type = VALUE_TYPES.UInt;
                    len = 1;
                    format = 'B';
                } else if (v >= -127 && v <= 128) {
                    type = VALUE_TYPES.Int;
                    len = 1;
                    format = 'b';
                } else if (v >= 0 && v <= 65536) {
                    type = VALUE_TYPES.UInt;
                    len = 2;
                    format = 'H';
                } else if (v >= -32767 && v <= 32767) {
                    type = VALUE_TYPES.Int;
                    len = 2;
                    format = 'h';
                } else {
                    type = v < 0 ? VALUE_TYPES.Int : VALUE_TYPES.UInt;
                    len = 4;
                    format = v < 0 ? 'i' : 'I';
                }
                message = message.concat(pack('IBH' + format, [messageKey, type, len, v]));
            } else
                message = message.concat(pack('IBH', [messageKey, VALUE_TYPES.ByteArray, v.length]), v);
            
        }

        send_message('APPLICATION_MESSAGE', message);

    }
    this.showSimpleNotificationOnPebble = function () {
    
    }
    this.getAccountToken = function () {
        return "";
    }
    this.getWatchToken = function () {
        return "";
    }
    this.addEventListener = function (eventName, handler) {
        if (!PebbleRuntimeState.handlers[eventName])
            PebbleRuntimeState.handlers[eventName] = [];
        PebbleRuntimeState.handlers[eventName].push(handler);
    }
    this.removeEventListener = function (eventName, handler) {
        if (PebbleRuntimeState.handlers[eventName]) {
            for (var i = 0; i < PebbleRuntimeState.handlers[eventName].length; i++) {
                if (PebbleRuntimeState.handlers[eventName][i] === handler) {
                    PebbleRuntimeState.handlers[eventName].splice(i, 1);
                    break;
                }
            }
        }
    }
    this.openURL = function () {
    
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
    this.clear = function() {
        localStorage.removeItem(storageKey);
    };
    // TODO: add more methods
}