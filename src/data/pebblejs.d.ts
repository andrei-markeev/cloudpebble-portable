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

interface PebbleJsVector2 {
    new(x: number, y: number);
    x: number;
    y: number;
}

namespace PebbleJsUI {

    type Color = 'black' | 'white' | 'clear' | string | number;

    interface ActionDef {
        /** An image to display in the action bar, next to the up button. */
        up?: string;
        /** An image to display in the action bar, next to the down button. */
        down?: string;
        /** An image to display in the action bar, next to the select button. */
        select?: string;
        /** The background color of the action bar. You can set this to 'white' for windows with black backgrounds. */
        backgroundColor?: Color;
    }

    interface StatusDef {
        /** The separate between the status bar and the content of the window. */
        separator?: 'dotted' | 'none';

        /** The foreground color of the status bar used to display the separator and time text. */
        color?: Color;

        /** The background color of the status bar. You can set this to 'black' for windows with white backgrounds. */
        backgroundColor?: Color;
    }

    interface WindowOptions {

        clear?: boolean;

        /** Action bar settings */
        action?: ActionDef;

        /** When `true`, the Pebble status bar will not be visible and the window will use the entire screen.
         * 
         * **Note**: `fullscreen` has been deprecated by `status` which allows settings
         * its color and separator in a similar manner to the `action` property.
         * 
         * Remove usages of `fullscreen` to enable usage of `status`.
        */
        fullscreen?: boolean;

        /** Whether the user can scroll this card with the up and down button.
         * When this is enabled, single and long click events on the up and down button
         * will not be transmitted to your app. */
        scrollable?: boolean;
    }

    abstract class WindowBase {
        /** This will push the window to the screen and display it. If user press the 'back' button, they
         * will navigate to the previous screen. */
        show(): void;

        /** This hides the window.
         * 
         * If the window is currently displayed, this will take the user to the previously
         * displayed window.
         * 
         * If the window is not currently displayed, this will remove it from the window stack.
         * The user will not be able to get back to it with the back button. */
        hide(): void;

        /** Registers a handler to call when button is pressed.
         * 
         * _Note_: You can also register button handlers for longClick.
        */
        on(eventName: 'click', button: 'up' | 'select' | 'down' | 'back', handler: () => void): void;

        /** Registers a handler to call when long press of the specified button was detected. */
        on(eventName: 'longClick', button: 'up' | 'select' | 'down' | 'back', handler: () => void): void;

        /** Registers a handler to call when the window is shown. This is useful for knowing when a user returns
         * to your window from another. This event is also emitted when programmatically showing the window.
         * 
         * This does **not** include when a Pebble notification popup is exited, revealing your window.
         */
        on(eventName: 'show', handler: () => void): void;

        /** Registers a handler to call when the window is hidden. This is useful for knowing when a user exits
         * out of your window or when your window is no longer visible because a different window is pushed on top.
         * This event is also emitted when programmatically hiding the window. This does not include when a Pebble
         * notification popup obstructs your window.
         * 
         * It is recommended to use this instead of overriding the back button when appropriate.
         */
        on(eventName: 'hide', handler: () => void): void;

        /** Nested accessor to the action property which takes an actionDef. Used to configure the action bar
         * with a new actionDef. See Window actionDef.
         * 
         * To disable the action bar after enabling it, `false` can be passed in place of an actionDef.
         */
        action(actionDef: ActionDef | false): void;

        /** Window.action can also be called with two arguments, field and value, to set specific fields of the window’s
         * action property. `field` is the name of a Window actionDef property as a string and `value` is the new property value. */
        action(field: 'up' | 'down' | 'select' | 'backgroundColor', value: string): void;

        /** Nested accessor to the status property which takes a statusDef. Used to configure the status bar with a new statusDef.
         * 
         * To disable the status bar after enabling it, `false` can be passed in place of statusDef.
         * 
         * Similarly, `true` can be used as a Window statusDef to represent a statusDef with all default properties.
         */
        status(statusDef: StatusDef | boolean): void;

        /** Window.status can also be called with two arguments, field and value, to set specific fields of the window’s
         * status property. `field` is the name of a Window statusDef property as a string and `value` is the new property value. */
        status(field: 'separator' | 'color' | 'backgroundColor', value: string): void;

        /** Returns the size of the max viewable content size of the window as a Vector2 taking into account whether 
         * there is an action bar and status bar. A Window will return a size that is shorter than a Window without for example.
         * 
         * If the automatic consideration of the action bar and status bar does not satisfy your use case, you can use 
         * Feature.resolution() to obtain the Pebble’s screen resolution as a Vector2. */
        size(): { x: number, y: number };
    }

    /** Unlike Card and Menu that provide mostly predefined, fixed interface, Window
     * is the most flexible. It allows you to add different Elements 
     * (Circle, Image, Line, Radial, Rect, Text, TimeText) and to specify a position and size
     * for each of them. Elements can also be animated.
     */
    class Window extends WindowBase {
        constructor(options: WindowOptions)

        /** Adds an element to to the Window. The element will be immediately visible. */
        add(element: Element): void;

        /** Inserts an element at a specific index in the list of Element. */
        insert(index: number, element: Element): void;

        /** Removes an element from the Window. */
        remove(element: Element): void;

        /** Returns the index of an element in the Window or -1 if the element is not in the window. */
        index(element: Element): void;

        /** Iterates over all the elements on the Window. */
        each(callback: (element: Element) => void): void;
    }

    interface CardOptions extends WindowOptions {
        /** Text to display in the title field at the top of the screen */
        title?: string;
        /** Text color of the title field */
        titleColor?: Color;
        /** Text to display below the title */
        subtitle?: string;
        /** Text to display in the body field */
        body?: string;
        /** Text color of the body field */
        bodyColor?: Color;
        /** An image to display before the title text */
        icon?: string;
        /** An image to display before the subtitle text. */
        subicon?: string;
        /** An image to display in the center of the screen.  */
        banner?: string;
        /** Selects the font used to display the body
         * 
         * The `small` and `large` styles correspond to the system notification styles.
         * `mono` sets a monospace font for the body textfield, enabling more complex text UIs or ASCII art.
         */
        style?: 'small' | 'large' | 'mono';
    }

    /** A Card is a type of Window that allows you to display a title, a subtitle, an image and
     * a body on the screen of Pebble.
     * 
     * Just like any window, you can initialize a Card by passing an object to the constructor
     * or by calling accessors to change the properties.
     * 
     * Note that all text fields will automatically span multiple lines if needed and that you
     * can use '\n' to insert line breaks.*/
    class Card extends Window {
        constructor(options: CardOptions);

        /** Get text to display in the title field at the top of the screen */
        title(): string;
        /** Set text to display in the title field at the top of the screen */
        title(value: string): void;

        /** Get text color of the title field */
        titleColor(): Color;
        /** Set text color of the title field */
        titleColor(value: Color): void;

        /** Get text to display below the title */
        subtitle(): string;
        /** Set text to display below the title */
        subtitle(value: string): void;

        /** Get text to display in the body field */
        body(): string;
        /** Set text to display in the body field */
        body(value: string): void;

        /** Get text color of the body field */
        bodyColor(): Color;
        /** Set text color of the body field */
        bodyColor(value: Color): void;

        /** Get an image to display before the title text */
        icon(): string;
        /** Set an image to display before the title text */
        icon(value: string): void;

        /** Get an image to display before the subtitle text. */
        subicon(): string;
        /** Set an image to display before the subtitle text. */
        subicon(value: string): void;

        /** Get an image to display in the center of the screen.  */
        banner(): string;
        /** Set an image to display in the center of the screen.  */
        banner(value: string): void;

        /** Get font style used to display the body */
        style(): void;

        /** Selects the font used to display the body
         * 
         * The `small` and `large` styles correspond to the system notification styles.
         * `mono` sets a monospace font for the body textfield, enabling more complex text UIs or ASCII art.
         */
        style(value: 'small' | 'large' | 'mono'): void;
    }

    interface MenuItem {
        title: string;
        subtitle?: string;
        icon?: string;
    }
    interface MenuSection {
        /** A list of all the items to display */
        items?: MenuItem[],
        /** Title text of the section header */
        title?: string;
        /** The background color of the section header */
        backgroundColor?: Color;
        /** The text color of the section header */
        textColor?: Color;
    }
    interface MenuOptions extends WindowOptions {
        /** A list of all the sections to display */
        sections?: MenuSection[];
        /** The background color of a menu item */
        backgroundColor?: Color;
        /** The text color of of a menu item */
        textColor?: Color;

        /** The background color of a selected menu item */
        highlightBackgroundColor?: Color;
        /** The text color of a selected menu item */
        highlightTextColor?: Color;
    }
    interface MenuSelectionEvent {
        /** The menu object */
        menu: Menu;
        /** The menu section object */
        section: MenuSection;
        /** The section index of the section of the selected item */
        sectionIndex: number;
        /** The menu item object */
        item: MenuItem;
        /** The item index of the selected item */
        itemIndex: number;
    }

    /** A menu is a type of Window that displays a standard Pebble menu on the screen of Pebble.
     * 
     * Just like any window, you can initialize a Menu by passing an object to the constructor or by calling 
     * accessors to change the properties. */
    class Menu extends Window {
        constructor(options: MenuOptions);

        /** Get the background color of a menu item */
        backgroundColor(): Color;
        /** Set the background color of a menu item */
        backgroundColor(value: Color): void;
        /** Get the text color of of a menu item */
        textColor(): Color;
        /** Set the text color of of a menu item */
        textColor(value: Color): void;

        /** Get the background color of a selected menu item */
        highlightBackgroundColor(): Color;
        /** Set the background color of a selected menu item */
        highlightBackgroundColor(value: Color): void;
        /** Get the text color of a selected menu item */
        highlightTextColor(): Color;
        /** Set the text color of a selected menu item */
        highlightTextColor(value: Color): void;

        /** Returns the section at the given sectionIndex */
        section(sectionIndex: number): void;
        /** Define the section to be displayed at sectionIndex */
        section(sectionIndex: number, section: MenuSection): void;

        /** Returns the items in a specific section */
        items(sectionIndex: number): MenuItem[];
        /** Define the items to display in a specific section */
        items(sectionIndex: number, items: MenuItem[]): void;

        /** Returns menu item at specific section and at specific index */
        item(sectionIndex: number, itemIndex: number): MenuItem;
        /** Define the item to display at index `itemIndex` in section `sectionIndex` */
        item(sectionIndex: number, itemIndex: number, item: MenuItem): void;

        /** Get the currently selected item and section */
        selection(callback: (event: MenuSelectionEvent) => void): void;

        /** Change the selected item and section */
        selection(sectionIndex: number, itemIndex: number): void;

        /** Registers a callback called when an item in the menu is selected (or long selected) */
        on(eventName: 'select' | 'longSelect', callback: (event: MenuSelectionEvent) => void): void;
    }
}

/** The Settings module allows you to add a configurable web view to your application 
 *  and share options with it. Settings also provides two data accessors `Settings.option`
 *  and `Settings.data` which are backed by localStorage. Data stored in `Settings.option`
 *  is automatically shared with the configurable web view. */
declare function require(modulePath: 'settings'): PebbleJsSettings;

/** This module gives you a very simple and easy way to make HTTP requests. */
declare function require(modulePath: 'ajax'): PebbleJsAjax;

/** A 2 dimensional vector. */
declare function require(modulePath: 'vector2'): PebbleJsVector2;

/** The UI framework contains all the classes needed to build the user interface of 
 * your Pebble applications and interact with the user. */
declare function require(modulePath: 'ui'): typeof PebbleJsUI;

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

/** The Platform module allows you to determine the current platform runtime on the watch 
 * through its Platform.version method. This is to be used when the Feature module does not 
 * give enough ability to discern whether a feature exists or not.
 */
declare function require(modulePath: 'platform'): any

/** The Feature module under Platform allows you to perform feature detection, adjusting aspects
 * of your application to the capabilities of the current watch model it is current running on.
 * This allows you to consider the functionality of your application based on the current set of 
 * available capabilities or features. The Feature module also provides information about features
 * that exist on all watch models such as Feature.resolution which returns the resolution of 
 * the current watch model.
 */
declare function require(modulePath: 'platform/feature'): any

/** The Clock module makes working with the Wakeup module simpler with its provided time utility
 * functions.
 */
declare function require(modulePath: 'clock'): any