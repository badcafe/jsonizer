///////////////////////////////
////// built-in revivers //////
///////////////////////////////

import { Errors } from './errors';
import { Reviver, Jsonizer } from './jsonizer';
import { Namespace } from './namespace';

// things to put at the end AFTER everything is defined

/**
 * A rewrite of `JSON.parse()` signature : if the reviver of `JSON.parse()`
 * is a nested reviver, we may know the return type.
 */
 declare global {
    interface JSON {
        /**
         * Converts a JavaScript Object Notation (JSON) string into an object.
         * @param text A valid JSON string.
         * @param reviver A function that transforms the results. This function is called for each member of the object.
         * If a member contains nested objects, the nested objects are transformed before the parent object is.
         */
        parse<Target = any>(
            text: string,
            reviver?: Target extends Reviver
                ? Target
                : ((this: any, key: string, value: any) => any)
        ): Target extends Reviver<infer Revived>
            ? Revived
            : Target
    }
}

// register revivers for built-in classes

Reviver<Date | null, string>({
    '.': date => date
        ? new Date(date)
        : null
})(Date);

function getErrConstructor(name: string): ErrorConstructor {
    const Err = Errors.errors[name as Errors.errors];
    if (Err) {
        return Err;
    } 
    try {
        const cl = Namespace.getClass(name) as ErrorConstructor // custom errors
        // MyError not found gives Error
        return cl === Error
            ? Errors.getClass(name)
            : cl;
    } catch (e) { // not found in registry ???
        return Errors.getClass(name);
    }
}

Reviver<Error | null, string>({
    '.': message => {
        if (message === null) {
            return null;
        }
        //         <--name-->  <--      message      -->
        // e.g. : 'RangeError: precision is out of range'
        let name: RegExpExecArray | string | null = /(\w(?:\s|\w)*):\s*(.*)/.exec(message);
        if (name?.[1]) {
            [, name, message] = name;
        }
        const Err = typeof name === 'string'
            ? getErrConstructor(name.trim())
            : Error;
        let err: Error;
        try {
            err = new Err(message);
        } catch (e) { // downgrade
            err = new (typeof name === 'string'
                ? Errors.getClass(name.trim())
                : Error
            )(message);
        }
        return err;
    }
})(Error);

declare global {
    interface Error {
        [Jsonizer.toJSON](): string
    }
}
Error.prototype[Jsonizer.toJSON] = function() {
    return 'constructor' in (this as any)
        ? this.message === ''
            ? Errors.getName((this as any).constructor)
            : `${Errors.getName((this as any).constructor)}: ${this.message}`
        : this.toString()
} // => 'RangeError: precision is out of range'
// almost like Error.prototype.toString

Reviver<RegExp | null, string>({
    '.': re => re
        ? new RegExp(re.slice(1,-1)) // '/the regexp/' => 'the regexp'
        : null
})(RegExp)
// NOTE: to avoid breaking standard behaviour
//               we don't set RegExp.prototype.toJSON  = RegExp.toString
//       instead we are using RegExp.prototype[Jsonizer.toJSON] = RegExp.toString
declare global {
    interface RegExp {
        [Jsonizer.toJSON](): string
    }
}
RegExp.prototype[Jsonizer.toJSON] = RegExp.prototype.toString // => '/the regexp/'

// TODO ???
// revivers for TypedArray: 
//                  Int8Array Int16Array Int32Array
//                  Uint8Array Uint8ClampedArray Uint16Array Uint32Array
//                  Float32Array Float64Array

/*
// TypedArray
JSON.stringify([new Int8Array([1]), new Int16Array([1]), new Int32Array([1])]);
// '[{"0":1},{"0":1},{"0":1}]'
JSON.stringify([new Uint8Array([1]), new Uint8ClampedArray([1]), new Uint16Array([1]), new Uint32Array([1])]);
// '[{"0":1},{"0":1},{"0":1},{"0":1}]'
JSON.stringify([new Float32Array([1]), new Float64Array([1])]);
// '[{"0":1},{"0":1}]'
*/
