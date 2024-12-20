interface PebbleRuntime {
    /**
     * Send an AppMessage to the app running on the watch. Messages should be in the form of JSON objects containing key-value pairs.
     * Please note that sendAppMessage is undefined in Rocky.js applications, see postMessage instead.
     * @param messageDict A JSON object containing key-value pairs to send to the watch. Keys must be defined in the Project Settings. Values in arrays that are greater then 255 will be mod 255 before sending.
     * @param onSuccess A developer-defined callback to run if the watch acknowledges (ACK) this message.
     * @param onFailure A developer-defined callback to run if the watch does NOT acknowledge (NACK) this message.
     */
    sendAppMessage(messageDict: Record<string, any>, onSuccess: (data: { transactionId: number }) => void, onFailure: (data: { transactionId: number }, err: string) => void): void;

    /**
     * When an app is marked as `configurable`, the PebbleKit JS component must implement `Pebble.openURL()` in the `showConfiguration`
     * event handler. The Pebble mobile app will launch the supplied URL to allow the user to configure the watchapp or watchface. 
     * See the [App Configuration guide](https://developer.rebble.io/developer.pebble.com/guides/user-interfaces/app-configuration-static/index.html).
     * @param url The URL of the static configuration page.
     */
    openURL(url: string): void;

    /**
     * Adds a listener for PebbleKit JS events.
     * 
     * `ready`: The watchapp has been launched and the PebbleKit JS component is now ready to receive events.
     */
    addEventListener(type: 'ready', callback: () => void): void;
    /**
     * Adds a listener for PebbleKit JS events.
     * 
     * `appmessage`: The watch sent an AppMessage to PebbleKit JS. The AppMessage Dictionary is contained in the payload property 
     * (i.e: event.payload). The payload consists of key-value pairs, where the keys are strings containing integers (e.g: "0"), 
     * or aliases for keys defined in package.json (e.g: "KEY_EXAMPLE"). Values should be integers, strings or byte arrays 
     * (arrays of characters). This event is not available to Rocky.js applications, and attempting to register it will throw
     * an exception.
     */
    addEventListener(type: 'appmessage', callback: (event: { payload: Record<string, number | string | Uint8Array> }) => void): void;

    /**
     * Adds a listener for PebbleKit JS events.
     * 
     * `showConfiguration`: The user has requested the app's configuration webview to be displayed. This can occur either upon 
     * the app's initial install or when the user taps 'Settings' in the 'My Pebble' view within the phone app.
     */
    addEventListener(type: 'showConfiguration', callback: () => void): void;

    /**
     * Adds a listener for PebbleKit JS events.
     * 
     * `webviewclosed`: The configuration webview was closed by the user. If the webview had a response, it will be contained
     * in the response property (i.e: `event.response`). This response can be used to feed back user preferences to the watchapp.
     * 
     * Response is a URI-encoded string. Usually it is in JSON format, so it should be parsed like this:
     * ```js
     * var settings = JSON.parse(decodeURIComponent(e.response));
     * ```
     * 
     * More details: [App Configuration (Manual setup)](https://developer.rebble.io/developer.pebble.com/guides/user-interfaces/app-configuration-static/index.html)
     */
    addEventListener(type: 'webviewclosed', callback: (event: { response: string }) => void): void;
    
}

declare var Pebble: PebbleRuntime;

// ----

declare var NaN: number;
declare var Infinity: number;

/**
 * Evaluates JavaScript code and executes it.
 * @param x A String value that contains valid JavaScript code.
 */
declare function eval(x: string): any;

/**
 * Converts a string to an integer.
 * @param string A string to convert into a number.
 * @param radix A value between 2 and 36 that specifies the base of the number in `string`.
 * If this argument is not supplied, strings with a prefix of '0x' are considered hexadecimal.
 * All other strings are considered decimal.
 */
declare function parseInt(string: string, radix?: number): number;

/**
 * Converts a string to a floating-point number.
 * @param string A string that contains a floating-point number.
 */
declare function parseFloat(string: string): number;

/**
 * Returns a Boolean value that indicates whether a value is the reserved value NaN (not a number).
 * @param number A numeric value.
 */
declare function isNaN(number: number): boolean;

/**
 * Determines whether a supplied number is finite.
 * @param number Any numeric value.
 */
declare function isFinite(number: number): boolean;

/**
 * Gets the unencoded version of an encoded Uniform Resource Identifier (URI).
 * @param encodedURI A value representing an encoded URI.
 */
declare function decodeURI(encodedURI: string): string;

/**
 * Gets the unencoded version of an encoded component of a Uniform Resource Identifier (URI).
 * @param encodedURIComponent A value representing an encoded URI component.
 */
declare function decodeURIComponent(encodedURIComponent: string): string;

/**
 * Encodes a text string as a valid Uniform Resource Identifier (URI)
 * @param uri A value representing an unencoded URI.
 */
declare function encodeURI(uri: string): string;

/**
 * Encodes a text string as a valid component of a Uniform Resource Identifier (URI).
 * @param uriComponent A value representing an unencoded URI component.
 */
declare function encodeURIComponent(uriComponent: string | number | boolean): string;

/**
 * Computes a new string in which certain characters have been replaced by a hexadecimal escape sequence.
 * @deprecated A legacy feature for browser compatibility
 * @param string A string value
 */
declare function escape(string: string): string;

/**
 * Computes a new string in which hexadecimal escape sequences are replaced with the character that it represents.
 * @deprecated A legacy feature for browser compatibility
 * @param string A string value
 */
declare function unescape(string: string): string;

interface Object {
    /** The initial value of Object.prototype.constructor is the standard built-in Object constructor. */
    constructor: Function;

    /** Returns a string representation of an object. */
    toString(): string;

    /** Returns a date converted to a string using the current locale. */
    toLocaleString(): string;

    /** Returns the primitive value of the specified object. */
    valueOf(): Object;

    /**
     * Determines whether an object has a property with the specified name.
     * @param v A property name.
     */
    hasOwnProperty(v: PropertyKey): boolean;

    /**
     * Determines whether an object exists in another object's prototype chain.
     * @param v Another object whose prototype chain is to be checked.
     */
    isPrototypeOf(v: Object): boolean;

    /**
     * Determines whether a specified property is enumerable.
     * @param v A property name.
     */
    propertyIsEnumerable(v: PropertyKey): boolean;
}

interface ObjectConstructor {
    new (value?: any): Object;
    (): any;
    (value: any): any;

    /** A reference to the prototype for a class of objects. */
    prototype: Object;

    /**
     * Returns the prototype of an object.
     * @param o The object that references the prototype.
     */
    getPrototypeOf(o: any): any;

    /**
     * Gets the own property descriptor of the specified object.
     * An own property descriptor is one that is defined directly on the object and is not inherited from the object's prototype.
     * @param o Object that contains the property.
     * @param p Name of the property.
     */
    getOwnPropertyDescriptor(o: any, p: PropertyKey): PropertyDescriptor | undefined;

    /**
     * Returns the names of the own properties of an object. The own properties of an object are those that are defined directly
     * on that object, and are not inherited from the object's prototype. The properties of an object include both fields (objects) and functions.
     * @param o Object that contains the own properties.
     */
    getOwnPropertyNames(o: any): string[];

    /**
     * Creates an object that has the specified prototype or that has null prototype.
     * @param o Object to use as a prototype. May be null.
     */
    create(o: object | null): any;

    /**
     * Creates an object that has the specified prototype, and that optionally contains specified properties.
     * @param o Object to use as a prototype. May be null
     * @param properties JavaScript object that contains one or more property descriptors.
     */
    create(o: object | null, properties: PropertyDescriptorMap & ThisType<any>): any;

    /**
     * Adds a property to an object, or modifies attributes of an existing property.
     * @param o Object on which to add or modify the property. This can be a native JavaScript object (that is, a user-defined object or a built in object) or a DOM object.
     * @param p The property name.
     * @param attributes Descriptor for the property. It can be for a data property or an accessor property.
     */
    defineProperty<T>(o: T, p: PropertyKey, attributes: PropertyDescriptor & ThisType<any>): T;

    /**
     * Adds one or more properties to an object, and/or modifies attributes of existing properties.
     * @param o Object on which to add or modify the properties. This can be a native JavaScript object or a DOM object.
     * @param properties JavaScript object that contains one or more descriptor objects. Each descriptor object describes a data property or an accessor property.
     */
    defineProperties<T>(o: T, properties: PropertyDescriptorMap & ThisType<any>): T;

    /**
     * Prevents the modification of attributes of existing properties, and prevents the addition of new properties.
     * @param o Object on which to lock the attributes.
     */
    seal<T>(o: T): T;

    /**
     * Prevents the modification of existing property attributes and values, and prevents the addition of new properties.
     * @param f Object on which to lock the attributes.
     */
    freeze<T extends Function>(f: T): T;

    /**
     * Prevents the modification of existing property attributes and values, and prevents the addition of new properties.
     * @param o Object on which to lock the attributes.
     */
    freeze<T extends { [idx: string]: U | null | undefined | object; }, U extends string | bigint | number | boolean | symbol>(o: T): Readonly<T>;

    /**
     * Prevents the modification of existing property attributes and values, and prevents the addition of new properties.
     * @param o Object on which to lock the attributes.
     */
    freeze<T>(o: T): Readonly<T>;

    /**
     * Prevents the addition of new properties to an object.
     * @param o Object to make non-extensible.
     */
    preventExtensions<T>(o: T): T;

    /**
     * Returns true if existing property attributes cannot be modified in an object and new properties cannot be added to the object.
     * @param o Object to test.
     */
    isSealed(o: any): boolean;

    /**
     * Returns true if existing property attributes and values cannot be modified in an object, and new properties cannot be added to the object.
     * @param o Object to test.
     */
    isFrozen(o: any): boolean;

    /**
     * Returns a value that indicates whether new properties can be added to an object.
     * @param o Object to test.
     */
    isExtensible(o: any): boolean;

    /**
     * Returns the names of the enumerable string properties and methods of an object.
     * @param o Object that contains the properties and methods. This can be an object that you created or an existing Document Object Model (DOM) object.
     */
    keys(o: object): string[];
}

/**
 * Provides functionality common to all JavaScript objects.
 */
declare var Object: ObjectConstructor;

/**
 * Creates a new function.
 */
interface Function {
    /**
     * Calls the function, substituting the specified object for the this value of the function, and the specified array for the arguments of the function.
     * @param thisArg The object to be used as the this object.
     * @param argArray A set of arguments to be passed to the function.
     */
    apply(this: Function, thisArg: any, argArray?: any): any;

    /**
     * Calls a method of an object, substituting another object for the current object.
     * @param thisArg The object to be used as the current object.
     * @param argArray A list of arguments to be passed to the method.
     */
    call(this: Function, thisArg: any, ...argArray: any[]): any;

    /**
     * For a given function, creates a bound function that has the same body as the original function.
     * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
     * @param thisArg An object to which the this keyword can refer inside the new function.
     * @param argArray A list of arguments to be passed to the new function.
     */
    bind(this: Function, thisArg: any, ...argArray: any[]): any;

    /** Returns a string representation of a function. */
    toString(): string;

    prototype: any;
    length: number;

    // Non-standard extensions
    arguments: any;
    caller: Function;
}

interface FunctionConstructor {
    /**
     * Creates a new function.
     * @param args A list of arguments the function accepts.
     */
    new (...args: string[]): Function;
    (...args: string[]): Function;
    prototype: Function;
}

declare var Function: FunctionConstructor;

/**
 * Extracts the type of the 'this' parameter of a function type, or 'unknown' if the function type has no 'this' parameter.
 */
type ThisParameterType<T> = T extends (this: infer U, ...args: never) => any ? U : unknown;

/**
 * Removes the 'this' parameter from a function type.
 */
type OmitThisParameter<T> = unknown extends ThisParameterType<T> ? T : T extends (...args: infer A) => infer R ? (...args: A) => R : T;

interface CallableFunction extends Function {
    /**
     * Calls the function with the specified object as the this value and the elements of specified array as the arguments.
     * @param thisArg The object to be used as the this object.
     */
    apply<T, R>(this: (this: T) => R, thisArg: T): R;

    /**
     * Calls the function with the specified object as the this value and the elements of specified array as the arguments.
     * @param thisArg The object to be used as the this object.
     * @param args An array of argument values to be passed to the function.
     */
    apply<T, A extends any[], R>(this: (this: T, ...args: A) => R, thisArg: T, args: A): R;

    /**
     * Calls the function with the specified object as the this value and the specified rest arguments as the arguments.
     * @param thisArg The object to be used as the this object.
     * @param args Argument values to be passed to the function.
     */
    call<T, A extends any[], R>(this: (this: T, ...args: A) => R, thisArg: T, ...args: A): R;

    /**
     * For a given function, creates a bound function that has the same body as the original function.
     * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
     * @param thisArg The object to be used as the this object.
     */
    bind<T>(this: T, thisArg: ThisParameterType<T>): OmitThisParameter<T>;

    /**
     * For a given function, creates a bound function that has the same body as the original function.
     * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
     * @param thisArg The object to be used as the this object.
     * @param args Arguments to bind to the parameters of the function.
     */
    bind<T, A extends any[], B extends any[], R>(this: (this: T, ...args: [...A, ...B]) => R, thisArg: T, ...args: A): (...args: B) => R;
}

interface NewableFunction extends Function {
    /**
     * Calls the function with the specified object as the this value and the elements of specified array as the arguments.
     * @param thisArg The object to be used as the this object.
     */
    apply<T>(this: new () => T, thisArg: T): void;
    /**
     * Calls the function with the specified object as the this value and the elements of specified array as the arguments.
     * @param thisArg The object to be used as the this object.
     * @param args An array of argument values to be passed to the function.
     */
    apply<T, A extends any[]>(this: new (...args: A) => T, thisArg: T, args: A): void;

    /**
     * Calls the function with the specified object as the this value and the specified rest arguments as the arguments.
     * @param thisArg The object to be used as the this object.
     * @param args Argument values to be passed to the function.
     */
    call<T, A extends any[]>(this: new (...args: A) => T, thisArg: T, ...args: A): void;

    /**
     * For a given function, creates a bound function that has the same body as the original function.
     * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
     * @param thisArg The object to be used as the this object.
     */
    bind<T>(this: T, thisArg: any): T;

    /**
     * For a given function, creates a bound function that has the same body as the original function.
     * The this object of the bound function is associated with the specified object, and has the specified initial parameters.
     * @param thisArg The object to be used as the this object.
     * @param args Arguments to bind to the parameters of the function.
     */
    bind<A extends any[], B extends any[], R>(this: new (...args: [...A, ...B]) => R, thisArg: any, ...args: A): new (...args: B) => R;
}

interface IArguments {
    [index: number]: any;
    length: number;
    callee: Function;
}

interface String {
    /** Returns a string representation of a string. */
    toString(): string;

    /**
     * Returns the character at the specified index.
     * @param pos The zero-based index of the desired character.
     */
    charAt(pos: number): string;

    /**
     * Returns the Unicode value of the character at the specified location.
     * @param index The zero-based index of the desired character. If there is no character at the specified index, NaN is returned.
     */
    charCodeAt(index: number): number;

    /**
     * Returns a string that contains the concatenation of two or more strings.
     * @param strings The strings to append to the end of the string.
     */
    concat(...strings: string[]): string;

    /**
     * Returns the position of the first occurrence of a substring.
     * @param searchString The substring to search for in the string
     * @param position The index at which to begin searching the String object. If omitted, search starts at the beginning of the string.
     */
    indexOf(searchString: string, position?: number): number;

    /**
     * Returns the last occurrence of a substring in the string.
     * @param searchString The substring to search for.
     * @param position The index at which to begin searching. If omitted, the search begins at the end of the string.
     */
    lastIndexOf(searchString: string, position?: number): number;

    /**
     * Determines whether two strings are equivalent in the current locale.
     * @param that String to compare to target string
     */
    localeCompare(that: string): number;

    /**
     * Matches a string with a regular expression, and returns an array containing the results of that search.
     * @param regexp A variable name or string literal containing the regular expression pattern and flags.
     */
    match(regexp: string | RegExp): RegExpMatchArray | null;

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string or regular expression to search for.
     * @param replaceValue A string containing the text to replace. When the {@linkcode searchValue} is a `RegExp`, all matches are replaced if the `g` flag is set (or only those matches at the beginning, if the `y` flag is also present). Otherwise, only the first match of {@linkcode searchValue} is replaced.
     */
    replace(searchValue: string | RegExp, replaceValue: string): string;

    /**
     * Replaces text in a string, using a regular expression or search string.
     * @param searchValue A string to search for.
     * @param replacer A function that returns the replacement text.
     */
    replace(searchValue: string | RegExp, replacer: (substring: string, ...args: any[]) => string): string;

    /**
     * Finds the first substring match in a regular expression search.
     * @param regexp The regular expression pattern and applicable flags.
     */
    search(regexp: string | RegExp): number;

    /**
     * Returns a section of a string.
     * @param start The index to the beginning of the specified portion of stringObj.
     * @param end The index to the end of the specified portion of stringObj. The substring includes the characters up to, but not including, the character indicated by end.
     * If this value is not specified, the substring continues to the end of stringObj.
     */
    slice(start?: number, end?: number): string;

    /**
     * Split a string into substrings using the specified separator and return them as an array.
     * @param separator A string that identifies character or characters to use in separating the string. If omitted, a single-element array containing the entire string is returned.
     * @param limit A value used to limit the number of elements returned in the array.
     */
    split(separator: string | RegExp, limit?: number): string[];

    /**
     * Returns the substring at the specified location within a String object.
     * @param start The zero-based index number indicating the beginning of the substring.
     * @param end Zero-based index number indicating the end of the substring. The substring includes the characters up to, but not including, the character indicated by end.
     * If end is omitted, the characters from start through the end of the original string are returned.
     */
    substring(start: number, end?: number): string;

    /** Converts all the alphabetic characters in a string to lowercase. */
    toLowerCase(): string;

    /** Converts all alphabetic characters to lowercase, taking into account the host environment's current locale. */
    toLocaleLowerCase(locales?: string | string[]): string;

    /** Converts all the alphabetic characters in a string to uppercase. */
    toUpperCase(): string;

    /** Returns a string where all alphabetic characters have been converted to uppercase, taking into account the host environment's current locale. */
    toLocaleUpperCase(locales?: string | string[]): string;

    /** Removes the leading and trailing white space and line terminator characters from a string. */
    trim(): string;

    /** Returns the length of a String object. */
    length: number;

    // IE extensions
    /**
     * Gets a substring beginning at the specified location and having the specified length.
     * @deprecated A legacy feature for browser compatibility
     * @param from The starting position of the desired substring. The index of the first character in the string is zero.
     * @param length The number of characters to include in the returned substring.
     */
    substr(from: number, length?: number): string;

    /** Returns the primitive value of the specified object. */
    valueOf(): string;

    [index: number]: string;
}

interface StringConstructor {
    new (value?: any): String;
    (value?: any): string;
    prototype: String;
    fromCharCode(...codes: number[]): string;
}

/**
 * Allows manipulation and formatting of text strings and determination and location of substrings within strings.
 */
declare var String: StringConstructor;

interface Boolean {
    /** Returns the primitive value of the specified object. */
    valueOf(): boolean;
}

interface BooleanConstructor {
    new (value?: any): Boolean;
    <T>(value?: T): boolean;
    prototype: Boolean;
}

declare var Boolean: BooleanConstructor;

interface Number {
    /**
     * Returns a string representation of an object.
     * @param radix Specifies a radix for converting numeric values to strings. This value is only used for numbers.
     */
    toString(radix?: number): string;

    /**
     * Returns a string representing a number in fixed-point notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toFixed(fractionDigits?: number): string;

    /**
     * Returns a string containing a number represented in exponential notation.
     * @param fractionDigits Number of digits after the decimal point. Must be in the range 0 - 20, inclusive.
     */
    toExponential(fractionDigits?: number): string;

    /**
     * Returns a string containing a number represented either in exponential or fixed-point notation with a specified number of digits.
     * @param precision Number of significant digits. Must be in the range 1 - 21, inclusive.
     */
    toPrecision(precision?: number): string;

    /** Returns the primitive value of the specified object. */
    valueOf(): number;
}

interface NumberConstructor {
    new (value?: any): Number;
    (value?: any): number;
    prototype: Number;

    /** The largest number that can be represented in JavaScript. Equal to approximately 1.79E+308. */
    MAX_VALUE: number;

    /** The closest number to zero that can be represented in JavaScript. Equal to approximately 5.00E-324. */
    MIN_VALUE: number;

    /**
     * A value that is not a number.
     * In equality comparisons, NaN does not equal any value, including itself. To test whether a value is equivalent to NaN, use the isNaN function.
     */
    NaN: number;

    /**
     * A value that is less than the largest negative number that can be represented in JavaScript.
     * JavaScript displays NEGATIVE_INFINITY values as -infinity.
     */
    NEGATIVE_INFINITY: number;

    /**
     * A value greater than the largest number that can be represented in JavaScript.
     * JavaScript displays POSITIVE_INFINITY values as infinity.
     */
    POSITIVE_INFINITY: number;
}

/** An object that represents a number of any kind. All JavaScript numbers are 64-bit floating-point numbers. */
declare var Number: NumberConstructor;

interface Math {
    /** The mathematical constant e. This is Euler's number, the base of natural logarithms. */
    E: number;
    /** The natural logarithm of 10. */
    LN10: number;
    /** The natural logarithm of 2. */
    LN2: number;
    /** The base-2 logarithm of e. */
    LOG2E: number;
    /** The base-10 logarithm of e. */
    LOG10E: number;
    /** Pi. This is the ratio of the circumference of a circle to its diameter. */
    PI: number;
    /** The square root of 0.5, or, equivalently, one divided by the square root of 2. */
    SQRT1_2: number;
    /** The square root of 2. */
    SQRT2: number;
    /**
      * Returns the absolute value of a number (the value without regard to whether it is positive or negative). 
      * For example, the absolute value of -5 is the same as the absolute value of 5.
      * @param x A numeric expression for which the absolute value is needed.
      */
    abs(x: number): number;
    /**
      * Returns the arc cosine (or inverse cosine) of a number. 
      * @param x A numeric expression.
      */
    acos(x: number): number;
    /** 
      * Returns the arcsine of a number. 
      * @param x A numeric expression.
      */
    asin(x: number): number;
    /**
      * Returns the arctangent of a number. 
      * @param x A numeric expression for which the arctangent is needed.
      */
    atan(x: number): number;
    /**
      * Returns the angle (in radians) from the X axis to a point.
      * @param y A numeric expression representing the cartesian y-coordinate.
      * @param x A numeric expression representing the cartesian x-coordinate.
      */
    atan2(y: number, x: number): number;
    /**
      * Returns the smallest number greater than or equal to its numeric argument. 
      * @param x A numeric expression.
      */
    ceil(x: number): number;
    /**
      * Returns the cosine of a number. 
      * @param x A numeric expression that contains an angle measured in radians.
      */
    cos(x: number): number;
    /**
      * Returns e (the base of natural logarithms) raised to a power. 
      * @param x A numeric expression representing the power of e.
      */
    exp(x: number): number;
    /**
      * Returns the greatest number less than or equal to its numeric argument. 
      * @param x A numeric expression.
      */
    floor(x: number): number;
    /**
      * Returns the natural logarithm (base e) of a number. 
      * @param x A numeric expression.
      */
    log(x: number): number;
    /**
      * Returns the larger of a set of supplied numeric expressions. 
      * @param values Numeric expressions to be evaluated.
      */
    max(...values: number[]): number;
    /**
      * Returns the smaller of a set of supplied numeric expressions. 
      * @param values Numeric expressions to be evaluated.
      */
    min(...values: number[]): number;
    /**
      * Returns the value of a base expression taken to a specified power. 
      * @param x The base value of the expression.
      * @param y The exponent value of the expression.
      */
    pow(x: number, y: number): number;
    /** Returns a pseudorandom number between 0 and 1. */
    random(): number;
    /** 
      * Returns a supplied numeric expression rounded to the nearest number.
      * @param x The value to be rounded to the nearest number.
      */
    round(x: number): number;
    /**
      * Returns the sine of a number.
      * @param x A numeric expression that contains an angle measured in radians.
      */
    sin(x: number): number;
    /**
      * Returns the square root of a number.
      * @param x A numeric expression.
      */
    sqrt(x: number): number;
    /**
      * Returns the tangent of a number.
      * @param x A numeric expression that contains an angle measured in radians.
      */
    tan(x: number): number;
}
/** An intrinsic object that provides basic mathematics functionality and constants. */
declare var Math: Math;

/** Enables basic storage and retrieval of dates and times. */
interface Date {
    /** Returns a string representation of a date. The format of the string depends on the locale. */
    toString(): string;
    /** Returns a date as a string value. */
    toDateString(): string;
    /** Returns a time as a string value. */
    toTimeString(): string;
    /** Returns a value as a string value appropriate to the host environment's current locale. */
    toLocaleString(): string;
    /** Returns a date as a string value appropriate to the host environment's current locale. */
    toLocaleDateString(): string;
    /** Returns a time as a string value appropriate to the host environment's current locale. */
    toLocaleTimeString(): string;
    /** Returns the stored time value in milliseconds since midnight, January 1, 1970 UTC. */
    valueOf(): number;
    /** Gets the time value in milliseconds. */
    getTime(): number;
    /** Gets the year, using local time. */
    getFullYear(): number;
    /** Gets the year using Universal Coordinated Time (UTC). */
    getUTCFullYear(): number;
    /** Gets the month, using local time. */
    getMonth(): number;
    /** Gets the month of a Date object using Universal Coordinated Time (UTC). */
    getUTCMonth(): number;
    /** Gets the day-of-the-month, using local time. */
    getDate(): number;
    /** Gets the day-of-the-month, using Universal Coordinated Time (UTC). */
    getUTCDate(): number;
    /** Gets the day of the week, using local time. */
    getDay(): number;
    /** Gets the day of the week using Universal Coordinated Time (UTC). */
    getUTCDay(): number;
    /** Gets the hours in a date, using local time. */
    getHours(): number;
    /** Gets the hours value in a Date object using Universal Coordinated Time (UTC). */
    getUTCHours(): number;
    /** Gets the minutes of a Date object, using local time. */
    getMinutes(): number;
    /** Gets the minutes of a Date object using Universal Coordinated Time (UTC). */
    getUTCMinutes(): number;
    /** Gets the seconds of a Date object, using local time. */
    getSeconds(): number;
    /** Gets the seconds of a Date object using Universal Coordinated Time (UTC). */
    getUTCSeconds(): number;
    /** Gets the milliseconds of a Date, using local time. */
    getMilliseconds(): number;
    /** Gets the milliseconds of a Date object using Universal Coordinated Time (UTC). */
    getUTCMilliseconds(): number;
    /** Gets the difference in minutes between the time on the local computer and Universal Coordinated Time (UTC). */
    getTimezoneOffset(): number;
    /** 
      * Sets the date and time value in the Date object.
      * @param time A numeric value representing the number of elapsed milliseconds since midnight, January 1, 1970 GMT. 
      */
    setTime(time: number): number;
    /**
      * Sets the milliseconds value in the Date object using local time. 
      * @param ms A numeric value equal to the millisecond value.
      */
    setMilliseconds(ms: number): number;
    /** 
      * Sets the milliseconds value in the Date object using Universal Coordinated Time (UTC).
      * @param ms A numeric value equal to the millisecond value. 
      */
    setUTCMilliseconds(ms: number): number;

    /**
      * Sets the seconds value in the Date object using local time. 
      * @param sec A numeric value equal to the seconds value.
      * @param ms A numeric value equal to the milliseconds value.
      */
    setSeconds(sec: number, ms?: number): number;
    /**
      * Sets the seconds value in the Date object using Universal Coordinated Time (UTC).
      * @param sec A numeric value equal to the seconds value.
      * @param ms A numeric value equal to the milliseconds value.
      */
    setUTCSeconds(sec: number, ms?: number): number;
    /**
      * Sets the minutes value in the Date object using local time. 
      * @param min A numeric value equal to the minutes value. 
      * @param sec A numeric value equal to the seconds value. 
      * @param ms A numeric value equal to the milliseconds value.
      */
    setMinutes(min: number, sec?: number, ms?: number): number;
    /**
      * Sets the minutes value in the Date object using Universal Coordinated Time (UTC).
      * @param min A numeric value equal to the minutes value. 
      * @param sec A numeric value equal to the seconds value. 
      * @param ms A numeric value equal to the milliseconds value.
      */
    setUTCMinutes(min: number, sec?: number, ms?: number): number;
    /**
      * Sets the hour value in the Date object using local time.
      * @param hours A numeric value equal to the hours value.
      * @param min A numeric value equal to the minutes value.
      * @param sec A numeric value equal to the seconds value. 
      * @param ms A numeric value equal to the milliseconds value.
      */
    setHours(hours: number, min?: number, sec?: number, ms?: number): number;
    /**
      * Sets the hours value in the Date object using Universal Coordinated Time (UTC).
      * @param hours A numeric value equal to the hours value.
      * @param min A numeric value equal to the minutes value.
      * @param sec A numeric value equal to the seconds value. 
      * @param ms A numeric value equal to the milliseconds value.
      */
    setUTCHours(hours: number, min?: number, sec?: number, ms?: number): number;
    /**
      * Sets the numeric day-of-the-month value of the Date object using local time. 
      * @param date A numeric value equal to the day of the month.
      */
    setDate(date: number): number;
    /** 
      * Sets the numeric day of the month in the Date object using Universal Coordinated Time (UTC).
      * @param date A numeric value equal to the day of the month. 
      */
    setUTCDate(date: number): number;
    /** 
      * Sets the month value in the Date object using local time. 
      * @param month A numeric value equal to the month. The value for January is 0, and other month values follow consecutively. 
      * @param date A numeric value representing the day of the month. If this value is not supplied, the value from a call to the getDate method is used.
      */
    setMonth(month: number, date?: number): number;
    /**
      * Sets the month value in the Date object using Universal Coordinated Time (UTC).
      * @param month A numeric value equal to the month. The value for January is 0, and other month values follow consecutively.
      * @param date A numeric value representing the day of the month. If it is not supplied, the value from a call to the getUTCDate method is used.
      */
    setUTCMonth(month: number, date?: number): number;
    /**
      * Sets the year of the Date object using local time.
      * @param year A numeric value for the year.
      * @param month A zero-based numeric value for the month (0 for January, 11 for December). Must be specified if numDate is specified.
      * @param date A numeric value equal for the day of the month.
      */
    setFullYear(year: number, month?: number, date?: number): number;
    /**
      * Sets the year value in the Date object using Universal Coordinated Time (UTC).
      * @param year A numeric value equal to the year.
      * @param month A numeric value equal to the month. The value for January is 0, and other month values follow consecutively. Must be supplied if numDate is supplied.
      * @param date A numeric value equal to the day of the month.
      */
    setUTCFullYear(year: number, month?: number, date?: number): number;
    /** Returns a date converted to a string using Universal Coordinated Time (UTC). */
    toUTCString(): string;
    /** Returns a date as a string value in ISO format. */
    toISOString(): string;
    /** Used by the JSON.stringify method to enable the transformation of an object's data for JavaScript Object Notation (JSON) serialization. */
    toJSON(key?: any): string;
}

interface DateConstructor {
    new (): Date;
    new (value: number): Date;
    new (value: string): Date;
    new (year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): Date;
    (): string;
    prototype: Date;
    /**
      * Parses a string containing a date, and returns the number of milliseconds between that date and midnight, January 1, 1970.
      * @param s A date string
      */
    parse(s: string): number;
    /**
      * Returns the number of milliseconds between midnight, January 1, 1970 Universal Coordinated Time (UTC) (or GMT) and the specified date. 
      * @param year The full year designation is required for cross-century date accuracy. If year is between 0 and 99 is used, then year is assumed to be 1900 + year.
      * @param month The month as an number between 0 and 11 (January to December).
      * @param date The date as an number between 1 and 31.
      * @param hours Must be supplied if minutes is supplied. An number from 0 to 23 (midnight to 11pm) that specifies the hour.
      * @param minutes Must be supplied if seconds is supplied. An number from 0 to 59 that specifies the minutes.
      * @param seconds Must be supplied if milliseconds is supplied. An number from 0 to 59 that specifies the seconds.
      * @param ms An number from 0 to 999 that specifies the milliseconds.
      */
    UTC(year: number, month: number, date?: number, hours?: number, minutes?: number, seconds?: number, ms?: number): number;
    now(): number;
}

declare var Date: DateConstructor;

interface RegExpMatchArray extends Array<string> {
    index?: number;
    input?: string;
}

interface RegExpExecArray extends Array<string> {
    index: number;
    input: string;
}

interface RegExp {
    /** 
      * Executes a search on a string using a regular expression pattern, and returns an array containing the results of that search.
      * @param string The String object or string literal on which to perform the search.
      */
    exec(string: string): RegExpExecArray;

    /** 
      * Returns a Boolean value that indicates whether or not a pattern exists in a searched string.
      * @param string String on which to perform the search.
      */
    test(string: string): boolean;

    /** Returns a copy of the text of the regular expression pattern. Read-only. The regExp argument is a Regular expression object. It can be a variable name or a literal. */
    source: string;

    /** Returns a Boolean value indicating the state of the global flag (g) used with a regular expression. Default is false. Read-only. */
    global: boolean;

    /** Returns a Boolean value indicating the state of the ignoreCase flag (i) used with a regular expression. Default is false. Read-only. */
    ignoreCase: boolean;

    /** Returns a Boolean value indicating the state of the multiline flag (m) used with a regular expression. Default is false. Read-only. */
    multiline: boolean;

    lastIndex: number;

    // Non-standard extensions
    compile(): RegExp;
}

interface RegExpConstructor {
    new (pattern: string, flags?: string): RegExp;
    (pattern: string, flags?: string): RegExp;
    prototype: RegExp;

    // Non-standard extensions
    $1: string;
    $2: string;
    $3: string;
    $4: string;
    $5: string;
    $6: string;
    $7: string;
    $8: string;
    $9: string;
    lastMatch: string;
}

declare var RegExp: RegExpConstructor;

interface Error {
    name: string;
    message: string;
}

interface ErrorConstructor {
    new (message?: string): Error;
    (message?: string): Error;
    prototype: Error;
}

declare var Error: ErrorConstructor;


interface Array<T> {
    /**
      * Gets or sets the length of the array. This is a number one higher than the highest element defined in an array.
      */
    length: number;
    /**
      * Returns a string representation of an array.
      */
    toString(): string;
    toLocaleString(): string;
    /**
      * Appends new elements to an array, and returns the new length of the array.
      * @param items New elements of the Array.
      */
    push(...items: T[]): number;
    /**
      * Removes the last element from an array and returns it.
      */
    pop(): T;
    /**
      * Combines two or more arrays.
      * @param items Additional items to add to the end of array1.
      */
    concat<U extends T[]>(...items: U[]): T[];
    /**
      * Combines two or more arrays.
      * @param items Additional items to add to the end of array1.
      */
    concat(...items: T[]): T[];
    /**
      * Adds all the elements of an array separated by the specified separator string.
      * @param separator A string used to separate one element of an array from the next in the resulting String. If omitted, the array elements are separated with a comma.
      */
    join(separator?: string): string;
    /**
      * Reverses the elements in an Array. 
      */
    reverse(): T[];
    /**
      * Removes the first element from an array and returns it.
      */
    shift(): T;
    /** 
      * Returns a section of an array.
      * @param start The beginning of the specified portion of the array.
      * @param end The end of the specified portion of the array.
      */
    slice(start?: number, end?: number): T[];

    /**
      * Sorts an array.
      * @param compareFn The name of the function used to determine the order of the elements. If omitted, the elements are sorted in ascending, ASCII character order.
      */
    sort(compareFn?: (a: T, b: T) => number): T[];

    /**
      * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
      * @param start The zero-based location in the array from which to start removing elements.
      */
    splice(start: number): T[];

    /**
      * Removes elements from an array and, if necessary, inserts new elements in their place, returning the deleted elements.
      * @param start The zero-based location in the array from which to start removing elements.
      * @param deleteCount The number of elements to remove.
      * @param items Elements to insert into the array in place of the deleted elements.
      */
    splice(start: number, deleteCount: number, ...items: T[]): T[];

    /**
      * Inserts new elements at the start of an array.
      * @param items  Elements to insert at the start of the Array.
      */
    unshift(...items: T[]): number;

    /**
      * Returns the index of the first occurrence of a value in an array.
      * @param searchElement The value to locate in the array.
      * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at index 0.
      */
    indexOf(searchElement: T, fromIndex?: number): number;

    /**
      * Returns the index of the last occurrence of a specified value in an array.
      * @param searchElement The value to locate in the array.
      * @param fromIndex The array index at which to begin the search. If fromIndex is omitted, the search starts at the last index in the array.
      */
    lastIndexOf(searchElement: T, fromIndex?: number): number;

    /**
      * Determines whether all the members of an array satisfy the specified test.
      * @param callbackfn A function that accepts up to three arguments. The every method calls the callbackfn function for each element in array1 until the callbackfn returns false, or until the end of the array.
      * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
      */
    every(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;

    /**
      * Determines whether the specified callback function returns true for any element of an array.
      * @param callbackfn A function that accepts up to three arguments. The some method calls the callbackfn function for each element in array1 until the callbackfn returns true, or until the end of the array.
      * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
      */
    some(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): boolean;

    /**
      * Performs the specified action for each element in an array.
      * @param callbackfn  A function that accepts up to three arguments. forEach calls the callbackfn function one time for each element in the array. 
      * @param thisArg  An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
      */
    forEach(callbackfn: (value: T, index: number, array: T[]) => void, thisArg?: any): void;

    /**
      * Calls a defined callback function on each element of an array, and returns an array that contains the results.
      * @param callbackfn A function that accepts up to three arguments. The map method calls the callbackfn function one time for each element in the array. 
      * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
      */
    map<U>(callbackfn: (value: T, index: number, array: T[]) => U, thisArg?: any): U[];

    /**
      * Returns the elements of an array that meet the condition specified in a callback function. 
      * @param callbackfn A function that accepts up to three arguments. The filter method calls the callbackfn function one time for each element in the array. 
      * @param thisArg An object to which the this keyword can refer in the callbackfn function. If thisArg is omitted, undefined is used as the this value.
      */
    filter(callbackfn: (value: T, index: number, array: T[]) => boolean, thisArg?: any): T[];

    /**
      * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
      * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
      * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
      */
    reduce(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T;
    /**
      * Calls the specified callback function for all the elements in an array. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
      * @param callbackfn A function that accepts up to four arguments. The reduce method calls the callbackfn function one time for each element in the array.
      * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
      */
    reduce<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;

    /** 
      * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
      * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array. 
      * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
      */
    reduceRight(callbackfn: (previousValue: T, currentValue: T, currentIndex: number, array: T[]) => T, initialValue?: T): T;
    /** 
      * Calls the specified callback function for all the elements in an array, in descending order. The return value of the callback function is the accumulated result, and is provided as an argument in the next call to the callback function.
      * @param callbackfn A function that accepts up to four arguments. The reduceRight method calls the callbackfn function one time for each element in the array. 
      * @param initialValue If initialValue is specified, it is used as the initial value to start the accumulation. The first call to the callbackfn function provides this value as an argument instead of an array value.
      */
    reduceRight<U>(callbackfn: (previousValue: U, currentValue: T, currentIndex: number, array: T[]) => U, initialValue: U): U;

    [n: number]: T;
}

interface ArrayConstructor {
    new (arrayLength?: number): any[];
    new <T>(arrayLength: number): T[];
    new <T>(...items: T[]): T[];
    (arrayLength?: number): any[];
    <T>(arrayLength: number): T[];
    <T>(...items: T[]): T[];
    isArray(arg: any): arg is Array<any>;
    prototype: Array<any>;
}

declare var Array: ArrayConstructor;

interface Storage {
    /**
     * Returns the number of key/value pairs.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/length)
     */
    length: number;
    /**
     * Removes all key/value pairs, if there are any.
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/clear)
     */
    clear(): void;
    /**
     * Returns the current value associated with the given key, or null if the given key does not exist.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/getItem)
     */
    getItem(key: string): string | null;
    /**
     * Returns the name of the nth key, or null if n is greater than or equal to the number of key/value pairs.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/key)
     */
    key(index: number): string | null;
    /**
     * Removes the key/value pair with the given key, if a key/value pair with the given key exists.
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/removeItem)
     */
    removeItem(key: string): void;
    /**
     * Sets the value of the pair identified by key to value, creating a new key/value pair if none existed for key previously.
     *
     * Throws a "QuotaExceededError" DOMException exception if the new value couldn't be set. (Setting could fail if, e.g., the user has disabled storage for the site, or if the quota has been exceeded.)
     *
     * Dispatches a storage event on Window objects holding an equivalent Storage object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Storage/setItem)
     */
    setItem(key: string, value: string): void;
    [name: string]: any;
}

declare var localStorage: Storage;

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console) */
interface Console {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/assert_static) */
    assert(condition?: boolean, ...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/clear_static) */
    clear(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/count_static) */
    count(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/countReset_static) */
    countReset(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/debug_static) */
    debug(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/dir_static) */
    dir(item?: any, options?: any): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/dirxml_static) */
    dirxml(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/error_static) */
    error(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/group_static) */
    group(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/groupCollapsed_static) */
    groupCollapsed(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/groupEnd_static) */
    groupEnd(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/info_static) */
    info(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/log_static) */
    log(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/table_static) */
    table(tabularData?: any, properties?: string[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/time_static) */
    time(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/timeEnd_static) */
    timeEnd(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/timeLog_static) */
    timeLog(label?: string, ...data: any[]): void;
    timeStamp(label?: string): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/trace_static) */
    trace(...data: any[]): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/console/warn_static) */
    warn(...data: any[]): void;
}

declare var console: Console;

interface XMLHttpRequest extends XMLHttpRequestEventTarget {
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/readystatechange_event) */
    onreadystatechange: ((this: XMLHttpRequest, ev: Event) => any) | null;
    /**
     * Returns client's state.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/readyState)
     */
    readyState: number;
    /**
     * Returns the response body.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/response)
     */
    response: any;
    /**
     * Returns response as text.
     *
     * Throws an "InvalidStateError" DOMException if responseType is not the empty string or "text".
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/responseText)
     */
    responseText: string;
    /**
     * Returns the response type.
     *
     * Can be set to change the response type. Values are: the empty string (default), "arraybuffer", "blob", "document", "json", and "text".
     *
     * When set: setting to "document" is ignored if current global object is not a Window object.
     *
     * When set: throws an "InvalidStateError" DOMException if state is loading or done.
     *
     * When set: throws an "InvalidAccessError" DOMException if the synchronous flag is set and current global object is a Window object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/responseType)
     */
    responseType: XMLHttpRequestResponseType;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/responseURL) */
    responseURL: string;
    /**
     * Returns the response as document.
     *
     * Throws an "InvalidStateError" DOMException if responseType is not the empty string or "document".
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/responseXML)
     */
    responseXML: Document | null;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/status) */
    status: number;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/statusText) */
    statusText: string;
    /**
     * Can be set to a time in milliseconds. When set to a non-zero value will cause fetching to terminate after the given time has passed. When the time has passed, the request has not yet completed, and this's synchronous flag is unset, a timeout event will then be dispatched, or a "TimeoutError" DOMException will be thrown otherwise (for the send() method).
     *
     * When set: throws an "InvalidAccessError" DOMException if the synchronous flag is set and current global object is a Window object.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/timeout)
     */
    timeout: number;
    /**
     * Returns the associated XMLHttpRequestUpload object. It can be used to gather transmission information when data is transferred to a server.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/upload)
     */
    upload: XMLHttpRequestUpload;
    /**
     * True when credentials are to be included in a cross-origin request. False when they are to be excluded in a cross-origin request and when cookies are to be ignored in its response. Initially false.
     *
     * When set: throws an "InvalidStateError" DOMException if state is not unsent or opened, or if the send() flag is set.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/withCredentials)
     */
    withCredentials: boolean;
    /**
     * Cancels any network activity.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/abort)
     */
    abort(): void;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/getAllResponseHeaders) */
    getAllResponseHeaders(): string;
    /** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/getResponseHeader) */
    getResponseHeader(name: string): string | null;
    /**
     * Sets the request method, request URL, and synchronous flag.
     *
     * Throws a "SyntaxError" DOMException if either method is not a valid method or url cannot be parsed.
     *
     * Throws a "SecurityError" DOMException if method is a case-insensitive match for `CONNECT`, `TRACE`, or `TRACK`.
     *
     * Throws an "InvalidAccessError" DOMException if async is false, current global object is a Window object, and the timeout attribute is not zero or the responseType attribute is not the empty string.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/open)
     */
    open(method: string, url: string | URL): void;
    open(method: string, url: string | URL, async: boolean, username?: string | null, password?: string | null): void;
    /**
     * Acts as if the `Content-Type` header value for a response is mime. (It does not change the header.)
     *
     * Throws an "InvalidStateError" DOMException if state is loading or done.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/overrideMimeType)
     */
    overrideMimeType(mime: string): void;
    /**
     * Initiates the request. The body argument provides the request body, if any, and is ignored if the request method is GET or HEAD.
     *
     * Throws an "InvalidStateError" DOMException if either state is not opened or the send() flag is set.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/send)
     */
    send(body?: Document | XMLHttpRequestBodyInit | null): void;
    /**
     * Combines a header in author request headers.
     *
     * Throws an "InvalidStateError" DOMException if either state is not opened or the send() flag is set.
     *
     * Throws a "SyntaxError" DOMException if name is not a header name or if value is not a header value.
     *
     * [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequest/setRequestHeader)
     */
    setRequestHeader(name: string, value: string): void;
    UNSENT: 0;
    OPENED: 1;
    HEADERS_RECEIVED: 2;
    LOADING: 3;
    DONE: 4;
    addEventListener<K extends keyof XMLHttpRequestEventMap>(type: K, listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof XMLHttpRequestEventMap>(type: K, listener: (this: XMLHttpRequest, ev: XMLHttpRequestEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var XMLHttpRequest: {
    prototype: XMLHttpRequest;
    new(): XMLHttpRequest;
    UNSENT: 0;
    OPENED: 1;
    HEADERS_RECEIVED: 2;
    LOADING: 3;
    DONE: 4;
};

interface XMLHttpRequestEventTargetEventMap {
    "abort": ProgressEvent<XMLHttpRequestEventTarget>;
    "error": ProgressEvent<XMLHttpRequestEventTarget>;
    "load": ProgressEvent<XMLHttpRequestEventTarget>;
    "loadend": ProgressEvent<XMLHttpRequestEventTarget>;
    "loadstart": ProgressEvent<XMLHttpRequestEventTarget>;
    "progress": ProgressEvent<XMLHttpRequestEventTarget>;
    "timeout": ProgressEvent<XMLHttpRequestEventTarget>;
}

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequestEventTarget) */
interface XMLHttpRequestEventTarget extends EventTarget {
    onabort: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onerror: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onload: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onloadend: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onloadstart: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    onprogress: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    ontimeout: ((this: XMLHttpRequest, ev: ProgressEvent) => any) | null;
    addEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(type: K, listener: (this: XMLHttpRequestEventTarget, ev: XMLHttpRequestEventTargetEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(type: K, listener: (this: XMLHttpRequestEventTarget, ev: XMLHttpRequestEventTargetEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var XMLHttpRequestEventTarget: {
    prototype: XMLHttpRequestEventTarget;
    new(): XMLHttpRequestEventTarget;
};

/** [MDN Reference](https://developer.mozilla.org/docs/Web/API/XMLHttpRequestUpload) */
interface XMLHttpRequestUpload extends XMLHttpRequestEventTarget {
    addEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(type: K, listener: (this: XMLHttpRequestUpload, ev: XMLHttpRequestEventTargetEventMap[K]) => any, options?: boolean | AddEventListenerOptions): void;
    addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions): void;
    removeEventListener<K extends keyof XMLHttpRequestEventTargetEventMap>(type: K, listener: (this: XMLHttpRequestUpload, ev: XMLHttpRequestEventTargetEventMap[K]) => any, options?: boolean | EventListenerOptions): void;
    removeEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | EventListenerOptions): void;
}

declare var XMLHttpRequestUpload: {
    prototype: XMLHttpRequestUpload;
    new(): XMLHttpRequestUpload;
};

interface JSON {
    /**
      * Converts a JavaScript Object Notation (JSON) string into an object.
      * @param text A valid JSON string.
      * @param reviver A function that transforms the results. This function is called for each member of the object. 
      * If a member contains nested objects, the nested objects are transformed before the parent object is. 
      */
    parse(text: string, reviver?: (key: any, value: any) => any): any;
    /**
      * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
      * @param value A JavaScript value, usually an object or array, to be converted.
      */
    stringify(value: any): string;
    /**
      * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
      * @param value A JavaScript value, usually an object or array, to be converted.
      * @param replacer A function that transforms the results.
      */
    stringify(value: any, replacer: (key: string, value: any) => any): string;
    /**
      * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
      * @param value A JavaScript value, usually an object or array, to be converted.
      * @param replacer Array that transforms the results.
      */
    stringify(value: any, replacer: any[]): string;
    /**
      * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
      * @param value A JavaScript value, usually an object or array, to be converted.
      * @param replacer A function that transforms the results.
      * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
      */
    stringify(value: any, replacer: (key: string, value: any) => any, space: string | number): string;
    /**
      * Converts a JavaScript value to a JavaScript Object Notation (JSON) string.
      * @param value A JavaScript value, usually an object or array, to be converted.
      * @param replacer Array that transforms the results.
      * @param space Adds indentation, white space, and line break characters to the return-value JSON text to make it easier to read.
      */
    stringify(value: any, replacer: any[], space: string | number): string;
}

/**
 * An intrinsic object that provides functions to convert JavaScript values to and from the JavaScript Object Notation (JSON) format.
 */
declare var JSON: JSON;


declare function require(filePath: string): any;