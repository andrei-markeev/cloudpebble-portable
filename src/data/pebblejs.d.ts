interface PebbleJsConfigOptions {
    /** The URL to the configurable. e.g. `http://www.example.com?name=value` */
    url: string;
    /** Whether to automatically save the web view response to options */
    autoSave?: boolean;
    /** Whether to automatically concatenate the URI encoded json Settings options to the URL as the hash component. */
    hash?: boolean;
}

interface PebbleJsSettings {
    /**
     * Set up the app configuration options, such as configuration page URL and the close callback
     * that receives configuration selected by the user.
     * 
     * @param open    optional callback used to perform any tasks before the webview is open,
     *                such as managing the options that will be passed to the web view.
     * @param close   is a callback that is called when the webview is closed via pebblejs://close.
     *                Any arguments passed to pebblejs://close is parsed and passed as options
     *                to the handler. Settings will attempt to parse the response first as URI encoded
     *                json and second as form encoded data if the first fails.
     */
    config(options: PebbleJsConfigOptions, open?: () => void, close: (eventData: { failed: boolean, options: any }) => void): void;
    /**
     * Set up the app configuration options, such as configuration page URL and the close callback
     * that receives configuration selected by the user.
     * 
     * @param close   is a callback that is called when the webview is closed via pebblejs://close.
     *                Any arguments passed to pebblejs://close is parsed and passed as options
     *                to the handler. Settings will attempt to parse the response first as URI encoded
     *                json and second as form encoded data if the first fails.
     */
    config(options: PebbleJsConfigOptions, close: (eventData: { failed: boolean, options: any }) => void): void;

    /** Data accessor built on localStorage that shares the options with the configurable web view.
     * 
     *  Returns the value of the option in field.
    */
    option(field: string): any;

    /**
     * Saves value to field. It is recommended that value be either a primitive or an object whose data
     * is retained after going through `JSON.stringify` and `JSON.parse`.
     * 
     * Example: `Settings.option('color', 'red');`
     * 
     * If value is undefined or `null`, the field will be deleted.
    */
    option(field: string, value: any): void;
}

interface PebbleJsAjaxOptions {
    /** The URL to make the ajax request to. e.g. `http://www.example.com?name=value` */
    url: string;

    /** The HTTP method to use */
    method?: 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options'
        | 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS';

    /** The content and response format. By default, the content format is 'form' and response format
     *  is separately 'text'. Specifying 'json' will have ajax send data as json as well as parse 
     *  the response as json. Specifying 'text' allows you to send custom formatted content and parse
     *  the raw response text.
     * 
     *  If you wish to send form encoded data and parse json, leave type undefined and use `JSON.decode`
     *  to parse the response data.
     */
    type?: 'form' | 'text';

    /** The request body, mainly to be used in combination with 'post' or 'put', e.g. `{ username: 'guest' }` */
    data?: any;

    /** Custom HTTP headers. Specify additional headers. e.g. `{ 'x-extra': 'Extra Header' }` */
    headers?: { [key: string]: string };

    /** Whether the request will be asynchronous. Specify `false` for a blocking, synchronous request.
     *  Default value is `true`
     */
    async?: boolean;

    /** Whether the result may be cached. Specify `false` to use the internal cache buster which appends
     *  the URL with the query parameter `_set` to the current time in milliseconds.
     *  Default value is `true`
     */
    cache?: boolean;
}

type PebbleJsAjax = 
/** Make http requests.
 * @param onSuccess The success callback will be called if the HTTP request is successful
 *                  (when the status code is inside [200, 300) or 304). The parameters are
 *                  the data received from the server, the status code, and the request object.
 *                  If the option `type: 'json'` was set, the response will automatically be
 *                  converted to an object, otherwise data is a string.
 * @param onFailure The failure callback is called when an error occurred or response code is
 *                  non-successful, e.g. >400.
 */
(
    options: PebbleJsAjaxOptions,
    onSuccess: (data: string | Object, statusCode: number, request) => void,
    onFailure: (data: string | Object, statusCode: number, request) => void
) => void;

/** The Settings module allows you to add a configurable web view to your application 
 *  and share options with it. Settings also provides two data accessors `Settings.option`
 *  and `Settings.data` which are backed by localStorage. Data stored in `Settings.option`
 *  is automatically shared with the configurable web view. */
declare function require(modulePath: 'settings'): PebbleJsSettings;

/** This module gives you a very simple and easy way to make HTTP requests. */
declare function require(modulePath: 'ajax'): PebbleJsAjax;

/** A 2 dimensional vector. */
declare function require(modulePath: 'vector2'): any

/** The UI framework contains all the classes needed to build the user interface of 
 * your Pebble applications and interact with the user. */
declare function require(modulePath: 'ui'): any

/** The Accel module allows you to get events from the accelerometer on Pebble. */
declare function require(modulePath: 'ui/accel'): any

/** Vibe allows you to trigger vibration on the user wrist. */
declare function require(modulePath: 'ui/vibe'): any

/** Light allows you to control the Pebble’s backlight. */
declare function require(modulePath: 'ui/light'): any

/** The Timeline module allows your app to handle a launch via a timeline action.
 * This allows you to write a custom handler to manage launch events outside of the app menu.
 * With the Timeline module, you can preform a specific set of actions based on the action 
 * which launched the app.
 */
declare function require(modulePath: 'timeline'): any

/** The Wakeup module allows you to schedule your app to wakeup at a specified time using 
 * Pebble’s wakeup functionality. Whether the user is in a different watchface or app, 
 * your app will launch at the specified time. This allows you to write a custom alarm app, 
 * for example. If your app is already running, you may also subscribe to receive the wakeup 
 * event, which can be useful for more longer lived timers. With the Wakeup module, you can 
 * save data to be read on launch and configure your app to behave differently based on 
 * launch data. The Wakeup module, like the Settings module, is backed by localStorage. */
declare function require(modulePath: 'wakeup'): any
