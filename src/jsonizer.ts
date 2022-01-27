/**
 * [User guide](https://badcafe.github.io/jsonizer)
 * 
 * @module
 */
import 'reflect-metadata';

import { namespace, Class } from './base'; // 'npm:@badcafe/jsonizer'

import { Namespace } from './namespace';
import { deepEquals, isPrimitive } from './util';
import { Errors } from './errors';

///////////////////////////////
///////// public API //////////
///////////////////////////////

/**
 * A plain object that describes the mappers of a class, an array,
 * a tuple, or a data structure.
 * 
 * The `Mappers` object is the counterpart inert structure of the
 * [`Reviver` type](#reviver-1) (which is a function).
 * 
 * ## Example
 * 
 * ```
 * // some class
 * class Thread {
 *      constructor(
 *          public date: Date, // built-in javascript Date
 *          public label: string,
 *          public comments: Comment[] // another custom class
 *      )
 * }
 * 
 * // our custom mapper
 * const threadMappers: Mappers<Thread> = {
 *    //👇 the "Self" entry '.' indicates how to create a new instance
 *      '.': ({date, label, comments}) => new Thread(date, label, comments)
 *    //👇 field mappers
 *      date: Date // 👈 delegate to the built-in Date mappers
 *      comments: {
 *        //👇 the "Any" entry '*' matches any indices of the array
 *          '*': Comment // 👈 delegate to the custom Comment mappers
 *      }
 * }
 * ```
 * @see [Reviver()](#reviver-2) To bind the mapper to the class
 * @see [[Jsonizer.reviver]] To create a reviver from the mapper
 * 
 * ## Description
 * 
 * The mappers indicates how an object or array and each of its property or items has to be
 * converted (by default the properties or items are left as-is). An object property or
 * array item can also describe its own mappers and so-on.
 * 
 * The more often (when Source and Target are the same) the properties of an object mapper
 * are the same of those of the object, or in case of an array mapper the indices in that
 * array (which is helpful for mapping tuples).
 * 
 * Some additional keys are available in the mapper :
 * 
 * * `'*'` that catches every other properties or indices that don't have a mapping, which
 * is helpful for arrays that contains the same kind of items
 * * `'.'` that indicates how to create the host instance from the properties or array
 * items **after** applying their mappings : it's a function that has `this` bound to a
 * stack of the ancestors of the actual item, itself passed as an argument, and that
 * returns the new instance expected
 * * `'/\\w+Date/'` which is a regexp key that can be set only on mappers for objects,
 * in this example it matches property names that end with 'Date'
 * * `'8-12'` which is a range key that can be set only on mappers for arrays, in this
 * example, it matches indexes from 8 to 12 included.
 * 
 * > Unlike all other keys, the `'.'` key is not a field mapper, but a builder function.
 * 
 * ### Built-in mappers
 * 
 * Built-in class mappers already exist for `Date`, `Error`, and `RegExp`.
 * 
 * ### Type parameters
 *
 * @paramType Target - The actual target class
 * @paramType Source - The JSON representation of `Target` is by default the structural `Target` itself
 * @paramType Match - An array of Regexp matchers if the Source is an object, e.g. `['/\\w+Date/']`,
 *          or an array of range matchers if the Source is an array, e.g. `['8-12']`.
 *
 * ## Customization
 * 
 * It is not recommended to override the following defaults, but yet possible :
 * 
 * @paramType Any - The mapper for any other field is bound to the key `'*'`
 * @paramType Self - The builder of the target instance is bound to the key `'.'`
 * @paramType Delim - The RegExp delimiter is by default `'/'`, and the range delimiter
 *      is by default `'-'`
 * 
 * If one of the jokers `Any` (`'*'`), `Self` (`'.'`) or `Delim` (`'/' | '-'`) is changed,
 * then the mapper must contain an array of that jokers bound to the symbol `[Jokers.Key]`
 * 
 * @see [[Jokers]]
 * @see [User guide - Revivers mappings](https://badcafe.github.io/jsonizer/#/README?id=revivers-mappings)
 * @see [User guide - Data Transfer Object](https://badcafe.github.io/jsonizer/#/README?id=dto)
 */
export type Mappers<
    Target,
    Source = Target,
    Match extends Mappers.Matcher<Source, Delim>[] = [],
    Any extends string = '*',
    Self extends string = '.',
    Delim extends string = Source extends Array<any> ? '-' : '/'
> = ({
        [key in Self]: Reviver.Reference // if it's a reference...
    } & {
        [index : number]: never // ...it's nothing else
      } /* & {
            [key in Any | Match[number] | keyof Source]?: never
        }*/
      & Mappers.Jokers.Custom<Any, Self, Delim>
) | ({
        // "this" contains the ancestors in the hierarchy
        [key in Self]?: ((this: any[], args: Source) => Target | any)
    } & (Source extends Array<infer Item>
        ? ({
            [index : number]: Reviver.Reference | Mappers<Item>
          } & {
            [key in Any | Match[number]]?: Reviver.Reference | Mappers<Item>
        } & Mappers.Jokers.Custom<Any, Self, Delim>)
        : Source extends string | number | boolean | null
            ? Mappers.Jokers.Custom<Any, Self, Delim>
            : ({
                [key in keyof Source]?: Reviver.Reference | Mappers<Source[key]>
              } & {
                [key in Any | Match[number]]?: Reviver.Reference | Mappers<any>
              } & Mappers.Jokers.Custom<Any, Self, Delim>)
    ))

/**
 * Property related types for mappers.
 */
export namespace Mappers {

    /**
     * A mapper may contain the entry `Self = '.'` for the host object
     * itself, and the entry `Any = '*'` for a catch-all mapping.
     * 
     * Additionnally, field names that matches a RegExp or indices that
     * matches a range can also be bound to a mapper ; the RegExp delimiter
     * is by default `Delim = '/'`, and the range delimiter is by default
     * `Delim = '-'`.
     * 
     * ## Customization
     * 
     * It is not recommended (useless ?) to customize the jokers, although it is
     * still possible.
     * 
     * ```
     * // do you really want to use this ?
     * interface FooSource {
     *      '*': string
     *      '.': number
     *      '/': boolean
     *      // and other members
     * }
     * // ok, then rename the special jokers '*',  '.' and     '/'
     * //                           by -say- '**', 'that', and '~' :
     * ClassMapper<Foo, FooSource, ['~\\w+~'], '**', 'that', '~'> = {
     *     // as soon as they are renamed, the next entry is mandatory :
     *     [Mappers.Jokers.$]: ['**', 'that', '~'],
     *     '**': {
     *          // '**' is the optional mapper for *Any* other fields
     *     }
     *     // 'that' is the optional mapper for *Self* builder
     *     'that': ({'*': star, '.': dot}) => new Foo(star, dot)
     *     '~\\w+~': AnotherMapper
     * }
     * ```
     */
    export namespace Jokers {

        /**
         * A key that allow to customize the jokers of a mapper object.
         * 
         * The default values are either `['*', '.', '/']` for a mapper
         * of an object, or `['*', '.', '-']` for a mapper of an array :
         * 
         * * "Any" (`'*'`) denotes any entry
         * * "Self" (`'.'`) denotes the host builder entry
         * * "Delim" (`'/'`) when used as the Regexp delimiter, e.g. `'/\\w+Date/'`
         * * "Delim" (`'-'`) when used as the range delimiter, e.g. `'8-12'`
         * 
         * @see [[Jokers]]
         */
        export const $ = Symbol.for(`${namespace}.JokersKey`);

        /**
         * Allow to customize jokers.
         * 
         * When `Any` is not `'*'` or `Self` is not `'.'` or `Delim` is not `'/'` or `'-'`,
         * then this type contains an entry that must contain an array with the new values.
         * 
         * 
         * @see [[Jokers]]
         */
        export type Custom<Any extends string, Self extends string, Delim extends string> =
            Self extends '.'
                ? Any extends '*'
                    ? Delim extends '/' | '-'
                        ? { [$]?: never } // prevent greedy type guard
                        : { [$]: [Any, Self, Delim] }
                    : { [$]: [Any, Self, Delim] }
                : { [$]: [Any, Self, Delim] };
    }

    /**
     * A matcher is either a regular expression for matching properties
     * of an object, or a range for matching indexes of an array.
     */
    export type Matcher<Source, Delim extends string> = Source extends Array<any>
        ? Matcher.Range<Delim>
        : Matcher.Regexp<Delim>;

    /**
     * A matcher is either a regular expression for matching properties
     * of an object, or a range for matching indexes of an array.
     * 
     * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=ranges-and-regexp)
     */
    export namespace Matcher {

        /**
         * A type for Regexp, e.g. `'/\\w+Date/'`
         * > RegExp keys are represented as strings, which may introduce additional
         * > escapes, e.g. `/\w+Date/.toString()` gives `'/\\w+Date/'`
         * 
         * @see [[Jokers]]
         * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=regexp)
         */
        export type Regexp<Delim extends string = '/'> = `${Delim}${string}${Delim}`;

        /**
         * A type for arrays range , e.g. `'8-12'` (included)
         * 
         * @see [[Jokers]]
         * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=ranges)
         */
        export type Range<Delim extends string='-'> = `${number}${Delim}${number}`;

        /**
         * Return -if any- the rexgexp mapper or range mapper that matches a property name
         * or an array index.
         * 
         * > **Doesn't return the exact match neither the "Any" match.**
         * 
         * @param mappers Contains the matching mappers.
         * @param prop The property name, or the array index.
         */
        export function getMatchingMapper(mappers: Mappers<any>, prop: string | number): Mappers<any> | undefined {
            const delim = mappers[Mappers.Jokers.$]?.[2]
                ?? typeof prop === 'string'
                    ? '/'  // regexp delim
                    : '-'; // range delim
            if (typeof prop === 'string') {
                // Regexp
                for (const [key, mapper] of Object.entries(mappers)) {
                    if (key.length > 1 && key[0] === delim && key[key.length -1] === delim
                        && new RegExp(key.slice(1, -1)).test(prop)
                    ) {
                        return mapper as Mappers<any>;
                    }
                }
            } else {
                // Range
                for (const [key, mapper] of Object.entries(mappers)) {
                    const [from, to] = key.split(delim)
                        .map(int => Number.parseInt(int));
                    if (from >= 0 && to > from && prop >= from && prop <= to) {
                        return mapper as Mappers<any>;
                    }
                }
            }
        }

        /**
         * Indicates whether a key is a Regexp, e.g. `'/\\w+Date/'`
         * 
         * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=regexp)
         */
        export function isRegExp(key: string, delim = '/'): boolean {
            return key.length > 1 && key[0] === delim && key[key.length -1] === delim            
        }

        /**
         * Indicates whether a key is a range, e.g. `'8-12'`
         * 
         * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=ranges)
         */
         export function isRange(key: string, delim = '-'): boolean {
            return ! isNaN(key.split(delim) // '8-12' => ['8', '12']
                .map(int => Number.parseInt(int)) // => [8, 12]
                .reduce<number>(
                    (prev, current, _, arr) => arr.length === 2
                        && prev < current
                            ? current
                            : NaN,
                    -1))
                    // 2 args only, the first > -1, the second > first, AND first and second are not NaN
                    // make fail '', 'abc', '0', '1', 'a-b', '0-a', 1-2-3', '-1-2', '0-0', '3-3', etc            
        }
    }
}

/**
 * The nested **reviver** to pass as the second argument of `JSON.parse()`.
 * 
 * It can be created :
 * 
 * * with [[Jsonizer.reviver]]()
 * * with [Reviver()](#reviver-2) as a class decorator or a function
 * * with a [[Replacer]] created with [[Jsonizer.replacer]]() after `JSON.stringify()`
 * 
 * Can also be invoked directly on a data structure to augment.
 * 
 * @see [User guide - `Jsonizer.reviver()`](https://badcafe.github.io/jsonizer/#/README?id=revivers-mappings)
 * @see [User guide - Classes](https://badcafe.github.io/jsonizer/#/README?id=classes)
 * @see [User guide - Replacer](https://badcafe.github.io/jsonizer/#/README?id=reviver-generation)
 */
export type Reviver<Target = any> = {

    // the implementation is the class internal.Reviver (see below)
    // wrapped in a proxy in order to make it a function and to extract subrevivers
    // we need a class in order to be able to decorate it like any class

    /**
     * Just the signature of the reviver argument in `JSON.parse()`
     */
    (key: string, value: any): Target

    /**
     * Do revive some data: apply recursively the mappers on a data
     * structure (not a JSON string)
     * 
     * @param data The data structure to transform
     * @returns The transformed data structure
     */
    (   // this: any[], // stack
        data: object | any[] | string | number | boolean | null
    ): Target

    // subrevivers
} & {
    [key: string]: Reviver<any>
} & {
    [index: number]: Reviver<any>
};

/**
 * The **replacer** to use as a second argument in `JSON.stringify()`.
 * 
 * After stringification, a reviver is available to restore the
 * original data structure. This function is a stateful function
 * that can be used once and only once in `JSON.stringify()`.
 * 
 * @paramType Type The type to replace, to have it in the reviver.
 * 
 * @see [[Replacer.getReviver]]
 * @see [[Jsonizer.replacer]]
 * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=reviver-generation)
 */
export interface Replacer<Type = any> {

    /**
     * Just the signature of the replacer argument in `JSON.stringify()`
     */
    (this: any, key: string, value: any): any

    /**
     * Get the revivers collected after `JSON.stringify()` when used with
     * this `Replacer` (can lead to an empty replacer), or undefined if
     * the valued stringified was a primitive.
     * 
     * @paramType Target The target of the reviver
     */
    getReviver<Target = Type>(): Reviver<Target>

    /**
     * Indicates if some mappings were collected.
     */
    isEmpty(): boolean

    /**
     * The JSON string representation of this replacer, after being used
     * in `JSON.stringify()`, maybe `undefined`.
     */
    toString(): string

}

/**
 * A class decorator that contains recipes to revive an instance from
 * its JSON representation.
 * 
 * ```typescript
 *@Reviver<Person>({ // 👈  bind the reviver to the class
 *    '.': ({name, birthDate}) => new Person(name, birthDate), // 👈  instance builder
 *    birthDate: Date // 👈  field mapper
 *})
 *class Person {
 *    constructor( // all fields are passed as arguments to the constructor
 *        public name: string,
 *        public birthDate: Date
 *    ) {}
 *}
 * ```
 * 
 * It contains mappers for reviving individual fields to specific instances and
 * a builder function to construct the final object from revived fields.
 * 
 * Basically, it performs the following tasks:
 * 
 * * Calls `Reviver.create()` with the given arguments
 * * Bound the created reviver to the decorated class
 * * Set the decorated class in the default namespace if it has no namespace
 * 
 * @paramType Target - The actual class to revive
 * @paramType Source - The JSON representation of `Target` is by default the structural `Target` itself
 * @paramType Match - An array of Regexp matchers if the Source is an object, e.g. `['/\\w+Date/']`,
 *          or an array of range matchers if the Source is an array, e.g. `['8-12']`.
 * 
 * @param mappers The mappers of the source fields.
 * 
 * @see [[Reviver.get]]
 * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=classes)
 */
export function Reviver<
    Target,
    Source = Target,
    Match extends Mappers.Matcher<Source, Delim>[] = [],
    Any extends string = '*',
    Self extends string = '.',
    Delim extends string = Source extends Array<any> ? '-' : '/'
>(mappers: Mappers<Target, Source, Match, Any, Self, Delim>): (target: Class<Target>) => void {
    return (target: Class<Target>) => {
        // set in the default namespace if it was not already in a namespace
        if (! Namespace.hasNamespace(target)) {
            Namespace('')(target);
            // further call to Namespace() will relocate it
        }
        Reflect.defineMetadata(
            Reviver.$,
            new internal.Reviver(mappers as any, target),
            target
        );
    }
}

/**
 * Handle revivers.
 */
export namespace Reviver {

    /**
     * @ignore
     * 
     * Metadata key.
     */
    export const $ = Symbol.for(`${namespace}.Reviver`);

    /**
     * Get the reviver of a class.
     * 
     * @param target The target class, by default will get the reviver's Reviver.
     */
     export function get<T = Reviver>(target: Class<T> = internal.Reviver as any): Reviver<T> {
        return Reflect.getMetadata($, target);
    }

    /**
     * Revive a reviver from a JSON structure.
     * 
     * @paramType Target - The type that the reviver can revive.
     * 
     * @param value A reviver structure.
     * @returns A reviver instance.
     */
    export function revive<Target>(value: Mappers<internal.Reviver>): Reviver<Target> {
        return new internal.Reviver(value) as any;
        // same as :
        // const reviver = get<internal.Reviver>();
        // return reviver.revive(value);
    }

    /**
     * @ignore
     * 
     * Either a class decorated with a reviver, or the qualified name of that class.
     * 
     * @see [[Namespace]]
     */
    export type Reference = Class | string

}

/**
 * [User guide](https://badcafe.github.io/jsonizer)
 */
export namespace Jsonizer {

    /**
     * The internal namespace is `'npm:@badcafe/jsonizer'`,
     * don't use it for your own libraries or app.
     */
    export const NAMESPACE = namespace;

    /**
     * An alternative key for objects to bind to a custom
     * `toJSON()` function ; when serialized with
     * [[Jsonizer.replacer]] or with [[Jsonizer.REPLACER]],
     * the method bound to this symbol will be used instead
     * of the standard method.
     * 
     * > If you want to left as is the default `toJSON()` function
     * > of an existing class, you may want instead create
     * > a custom `[Jsonizer.toJSON]()` function.
     * 
     * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=jsonizertojson)
     */
    export const toJSON: unique symbol = Symbol.for(`${namespace}.toJSON`);

    /**
     * Create a nested reviver that can convert a value and its
     * nested values.
     * 
     * ## Usage 
     * 
     * ```typescript
     * const personReviver = Jsonizer.reviver<typeof person>({
     *     birthDate: Date
     * });
     * ```
     * 
     * @param mappers Mapper for the current value and children values
     * @return A reviver that can be passed to `JSON.parse()` or
     *      that can be used as a reviver object on which one can
     *      directly call `.revive()`. That reviver can also be
     *      itself serialized and revived.
     * 
     * @see [User guide - Objects](https://badcafe.github.io/jsonizer/#/README?id=objects)
     * @see [User guide - Arrays](https://badcafe.github.io/jsonizer/#/README?id=arrays)
     * @see [User guide - Nested mapping](https://badcafe.github.io/jsonizer/#/README?id=nested-mappings)
     * @see [User guide - Tuples](https://badcafe.github.io/jsonizer/#/README?id=tuples)
     */
    export function reviver<
        Target,
        Source = Target,
        Match extends Mappers.Matcher<Source, Delim>[] = [],
        Any extends string = '*',
        Self extends string = '.',
        Delim extends string = Source extends Array<any> ? '-' : '/'
    >(
        mappers: Mappers<Target, Source, Match, Any, Self, Delim>
    ): Reviver<Target> {
        return new internal.Reviver(mappers as any) as any as Reviver;
    }

    /**
     * Create a `replacer` function to use with `JSON.stringify()` ;
     * this replacer can capture the revivers.
     * 
     * > During stringification, custom `[Jsonizer.toJSON]()` functions
     * will be used instead of the standard method.
     * 
     * ## Capture phase
     * 
     * ```
     * // user structure to stringify :
     * const data = getDataSomehow(); // your code
     * // create a context for the capture :
     * const replacer = Jsonizer.replacer();
     * // stringify with our replacer that also capture the mappings
     * const jsonData = JSON.stringify(data, replacer);
     * ```
     * 
     * Next, the `jsonData` string result can be send elsewhere with
     * its `reviver` object, that can be stringified too :
     * 
     * ```
     * // every class decorated with `@Reviver` were captured
     * const jsonReviver = replacer.toString()
     * // same as :
     * const jsonReviver = JSON.stringify(replacer.getReviver());
     * 
     * sendOrStoreOrWhatever(jsonData, jsonReviver);
     * ```
     * 
     * ## Revive phase
     * 
     * To respawn the data, pass the reviver to `JSON.parse()` :
     * 
     * ```
     * function getData(jsonData: string, jsonReviver: string) {
     *      // revive the reviver                          👇 get the reviver for revivers
     *      const reviver = JSON.parse(jsonReviver, Reviver.get());
     *      // revive the data with the reviver
     *      return JSON.parse(json, reviver);
     * }
     * ```
     * 
     * @paramType Type The type to replace, to have it in the reviver.
     * 
     * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=replacer)
     */
    export function replacer<Type = any>(): Replacer<Type> {
        return new internal.Replacer() as any as Replacer<Type>;
    }

    /**
     * Just a placeholder `replacer()` that tells to use customs
     * functions `[Jsonizer.toJSON]()` instead of the standard
     * method.
     * 
     * > `JSON.stringify()` used without `Jsonizer.replacer()`
     * > or without `Jsonizer.REPLACER` won't use custom
     * > `[Jsonizer.toJSON]()` functions.
     * 
     * ## Usage
     * 
     * ```typescript
     * JSON.stringify(data, Jsonizer.REPLACER);
     * ```
     * 
     * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=jsonizertojson)
     */
    export const REPLACER = function getJSON(key: string, value: any): any { // this is not 'toJSON()'
        // (key, value): any, just to have the signature of a replacer
        return value?.[Jsonizer.toJSON]
            ? value[Jsonizer.toJSON]() // may return null or undefined
            // else normal behaviour, potentially let go on with value.toJSON()
            : value;
    }

    /**
     * Helper mapping functions for the `Self` key `'.'` 
     */
    export namespace Self {

        // see at the end the decorators

        /**
         * A mapper class that keep unchanged a value ; this
         * is useful when the `'*'` (Any) key is used to map
         * every value, except some of them that would be mapped
         * to the identity.
         * 
         * ```typescript
         * @Reviver<Hobby>({
         *     '.': Jsonizer.Self.apply(Hobby),
         *     '*': Date // 👈 matches any field...
         *     hobby: Jsonizer.Self.Identity // 👈  ...except 'hobby', kept unchanged
         * })
         * ```
         * 
         * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=pass-through-identity)
         */
        export class Identity {
            /** @ignore */
            constructor() {
                throw new TypeError('Creating an instance of Identity class is non sense')
            }
        }

        /**
         * A mapping function for the `Self` key `'.'` that
         * passes all the data in order to the constructor.
         * 
         * ```
         * { '.': Jsonizer.Self.apply(Foo) }
         * ```
         * is the same as
         * ```
         * { '.': args => new Foo(Object.values(args)) }
         * ```
         * 
         * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=self-apply)
         */
        export function apply<T>(clazz: Class.Concrete<T>): (args: object) => T {
            return (args: object) => new clazz(...Object.values(args));
        }

        /**
         * A mapping function for the `Self` key `'.'` that
         * assigns all the data properties to the new object.
         * 
         * ```
         * { '.': Jsonizer.Self.assign(Foo) }
         * ```
         * is the same as
         * ```
         * { '.': args => {
         *     const foo = new Foo();
         *     Object.assign(foo, args);
         *     return foo;
         * }
         * ```
         * 
         * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=self-assign)
         */
        export function assign<T>(clazz: Class.Concrete<T>): (args: object) => T {
            return (args: object) => {
                const obj = new clazz();
                Object.assign(obj, args);
                return obj;
            }
        }

    }

}

///////////////////////////////
//////// internal API /////////    well... not as trivial as it seems at first glance
///////////////////////////////

// Mappers$ because there is a Mapper name that already exist above
const Mappers$ = Symbol.for(`${namespace}.Mappers`);
const Clazz = Symbol.for(`${namespace}.Class`);

/**
 * Jsonizer algorithms
 */
namespace internal {
    // because there is a Reviver name and a Replacer name that already exist above

    /**
     * Reviver for Reviver, a.k.a. "meta" Reviver
     * Since Reviver is already a decorator function,
     * we are setting this internal class with a qualified name
     * in order to retrieve it easily ; and it can be serialized
     */
    export class Reviver extends Function { // I do wanted it to be 'npm:@badcafe/jsonizer.Reviver'
    // see at the end the decorators

        static $ = Mappers$;

        // internal representation
        [Mappers$]: Mappers<Reviver, any>
        // this might be the reviver of a class
        [Clazz]?: Class<any>
        // ! above properties are keyed with Symbols

        constructor(mappers: Mappers<Reviver, any>, clazz?: Class<any>) {
            super();
            this[Mappers$] = mappers;
            this[Clazz] = clazz;
            // we have a wrapper around internal.Reviver
            // because this instance also has to be a function
            // and also because we can extract subrevivers from it
            return new Proxy(this, {
                // the reviver function is
                //      fun(key, value): any, when passed as 2nd argument to JSON.parse()
                // or   fun(json)             when used on already parsed data
                apply(target, thisArg, argArray) {
                    if (argArray.length === 1) {
                        const [json] = argArray;
                        return Reviver.revive<Reviver>([], json, target[Mappers$]);
                    } else {
                        const [key, value]: [string, any] = argArray as any;
                        // JSON.parse terminates with the root key ''
                        if (key === '') {
                            return Reviver.revive<Reviver>([], value, target[Mappers$]); // do it !
                        } else {
                            return value;
                        }
                    }
                },
                // allow to extract a subreviver
                get(target, prop, receiver) {
                    if (typeof prop === 'number' || (typeof prop === 'string'
                        // exclude internal.Reviver.toJSON()
                        && prop !== 'toJSON')
                    ) {
                        const [any, self] = Reflect.get(target, Mappers.Jokers.$, receiver)
                            ?? ['*', '.'];
                        if (prop === any || prop === self) {
                            return Reflect.get(target, Mappers$, receiver)[prop];
                        } else {
                            // subreviver
                            const mappers = Reflect.get(target, internal.Reviver.$, receiver);
                            const key = Number(prop);
                            const submapper = mappers[prop] // exact match
                                ?? (Number.isNaN(key)
                                        ? Mappers.Matcher.getMatchingMapper(mappers, prop) // regexp
                                        : Mappers.Matcher.getMatchingMapper(mappers, key) // or range match*/
                                    )
                                    ?? mappers[any] // any match (if defined)
                                        ?? {} // fallback
                            return Jsonizer.reviver(submapper);
                        }
                    } else {
                        // preserve 'toJSON()' and [internal.Reviver.$]
                        return Reflect.get(target, prop, receiver);
                    }
                },
                ownKeys(target) {
                    const mappers = Reflect.get(target, Mappers$);
                    const ownKeys = new Set(Reflect.ownKeys(mappers));
                    ownKeys.add('arguments'); // required by Proxy...
                    ownKeys.add('caller');
                    ownKeys.add('prototype');
                    return [...ownKeys.keys()];
                },
                getOwnPropertyDescriptor(target, prop) {
                    // required by Proxy...
                    return Reflect.getOwnPropertyDescriptor(target, prop)
                        ?? {
                            enumerable: true,
                            configurable: true
                        };
                }
            });
        }

        toJSON(key: string): any {
            return this[Clazz]
                ? key === '' // is it a top standalone class ?
                    ? { '.': Namespace.getQualifiedName(this[Clazz]!) }
                    : Namespace.getQualifiedName(this[Clazz]!) // just the class qname
                : toJSON(this[Mappers$]); // the tree
        }

        // the "do revive function"
        static revive<Target>(
            ctxt: any[], // stack
            json: object | any[] | string | number | boolean | null,
            mappers: Mappers<Target> // maybe of other related types, cast as any (see below)
        ): Target {
            if (mappers instanceof Reviver) { // Reviver implements Mapper type
                // we are using the internal representation
                mappers = mappers[Mappers$] as any;
            }
            const stack = ctxt
                ? (ctxt.push(json), ctxt)
                : [json]; // init
            try {
                const isArray = Array.isArray(json);
                let [Any, Self, delim] = mappers[Mappers.Jokers.$] ?? ['*', '.', isArray ? '-' : '/'];
                let selfMapper: undefined | ((args: any) => Target);
                let anyMapper: undefined | Mappers<any>;

                function resolveMapper(mapper: Reviver.Reference | Mappers<any>, key: string | number) {
                    // some lookups
                    if (typeof mapper === 'string') {
                        // mapper is a qualified name
                        mapper = Namespace.getClass(mapper);
                        // mapper is now a class
                    }
                    if (typeof mapper === 'function') {
                        const funMapper = ReviverAPI.get(mapper);
                        // mapper is now a reviver
                        // make the lookup done once :
                        if (funMapper) {
                            (mappers as any)[key] = funMapper;
                            mapper = funMapper;
                        } // else case of Self : mapper could be the function instance builder
                    }
                    return mapper as Mappers<any>;
                }

                type Matcher = {
                    // Regexp.test() or range.test()
                    test(prop: string | number): boolean
                };
                const matchMappers: [string, Matcher, Mappers<any>][] = [] // [key, matcher, mappers][]
                function applyMatcherOrAny(prop: string | number) {
                    const value = (json as any)[prop]; // json object or json array
                    // eslint-disable-next-line prefer-const
                    for (let [key, matcher, mapper] of matchMappers) {
                        if (matcher.test(prop)) {
                            // apply '/the regexp/' mapper or 'from-to' mapper
                            mapper = resolveMapper(mapper, key);
                            (json as any)[prop] = Reviver.revive(stack, value, mapper);
                            return;
                        }
                    }
                    if (anyMapper) { // apply '*'
                        anyMapper = resolveMapper(anyMapper!, Any);
                        (json as any)[prop] = Reviver.revive(stack, value, anyMapper);
                    }
                }

                const context = isArray
                    ? {
                        isArray,
                        keys: new Set<number>(), // remember visited keys because '*' means 'any others'
                        // for some optimization below :
                        startAny: -1, // the index where starting applying '*' if they are not in keys
                        restAny: -1, // the index where applying '*' regardless they are in keys
                        key: -1, // current mapper key, but as a number
                        i: -1, // index
                    }
                    : {
                        isArray,
                        keys: new Set<string>(), // remember visited keys because '*' means 'any others'
                    }

                // case of {'.': 'Foo'} => {'.': Foo} => {'.': () => new Foo(), bar: Qux }
                let classMapper: Mappers<Target> | undefined;
                // iterable mappers entries, may be extended to some class mappers entries
                const entries = {
                    * [Symbol.iterator]() {
                        yield * Object.entries(mappers);
                        // may be set during iteration if {'.': 'Foo'} found, see below
                        if (classMapper) {
                            // refresh jokers, because we switch to a different type
                            [Any, Self, delim] = classMapper[Mappers.Jokers.$] ?? ['*', '.', isArray ? '-' : '/'];
                            // extract
                            classMapper = (classMapper as any)[Mappers$];
                            yield * Object.entries(classMapper!)
                                .filter(([key]) => key !== Self);
                                // because the builder was already extracted, see below
                        }
                    }
                }
                // apply exact mapper, collect other keys (Any, Self, range or regexp)
                // eslint-disable-next-line prefer-const
                for (let [key, mapper] of entries) { // Object.entries(mappers) + classMapper if resolved
                    if (key === Any) {
                        // apply '*' mapper after the last
                        anyMapper = mapper as Mappers<any>;
                    } else if (key === Self) {
                        // apply '.' builder after the members
                        if (typeof mapper === 'string') {
                            // mapper is a qualified name
                            mapper = Namespace.getClass(mapper);
                            // mapper is now a class
                        }
                        if (typeof mapper === 'function') { // !!! maybe a builder or a class decorated with @Reviver
                            classMapper = ReviverAPI.get(mapper as any) as any;
                            const itSelf = classMapper?.[Mappers.Jokers.$]?.[1] ?? '.';
                            if (classMapper?.[itSelf]) {
                                mapper = classMapper[itSelf]!;
                                // we set it also to mappers because resolveMapper()
                                // may attach some funMapper inside ; this doesn't
                                // affect entries <- Object.entries(mappers) because
                                // it's already done
                                mappers = mapper as any;
                            } else { // else it is assumed to be a builder
                                classMapper = undefined; // it is not {'.': Foo} but {'.': () => new Foo()}
                            }
                            // classMapper participates to the current for loop iteration
                        }
                        selfMapper = mapper as any; // it's a builder, not a mapper
                    } else if (! context.isArray && Mappers.Matcher.isRegExp(key, delim)) {
                        // it's a regexp, apply '/the regexp/' mapper after the last but before '*'
                        matchMappers.push([
                            key,
                            new RegExp(key.slice(1, -1)),
                            mapper as Mappers<any>
                        ]);
                    } else if (context.isArray && Mappers.Matcher.isRange(key, delim)) {
                        // it's a range, apply 'from-to' Range mapper after the last but before '*'
                        const [from, to] = key.split(delim)
                            .map(int => Number.parseInt(int));
                        matchMappers.push([
                            key,
                            { test: (i: number) => i >= from && i <= to },
                            mapper as Mappers<any>
                        ]);
                    } else if (mapper) { // exact match !
                        // remember visited keys + optimization for arrays
                        if (context.isArray) {
                            // the type accept small variations of numbers
                            // a range '12-12' give 12, keep it !
                            //         '-10' give 10, keep it !
                            context.key = Math.abs(Number.parseInt(key));
                            context.i++;
                            if (context.key === context.i && context.startAny === context.i) {
                                context.startAny = context.i + 1;
                            } else {
                                // there is a rupture in the sequence
                                // don't apply '*' to that key
                                context.keys.add(context.key);
                            }
                            context.restAny = Math.max(context.restAny, context.key);
                        } else {
                            context.keys.add(key);
                        }
                        // do apply exact match
                        mapper = resolveMapper(mapper as any, key);
                        if (context.isArray) {
                            const i = Number.parseInt(key);
                            const value = (json as any[])[i];
                            if (value !== undefined) {
                                (json as any[])[i] = Reviver.revive(stack, value, mapper);
                            }
                        } else if (typeof json === 'object') { // prevent unexpected mappings
                            const value = (json as any)[key];
                            if (value !== undefined) {
                                (json as any)[key] = Reviver.revive(stack, value, mapper);
                            }
                        } // else can't happen
                    } // else mapper is null, for function.arguments
                }
                if (anyMapper || matchMappers.length > 0) {
                    if (context.isArray) {
                        context.startAny = Math.max(context.startAny, 0);
                        context.restAny = Math.max(context.restAny, 0);
                        // For example:
                        // when [0], [1], [3], [5], [7], [*] are mappers
                        // [0..1] : already done, startAny = 2, restAny = 8
                        for (let i = context.startAny; i < context.restAny; i++) {
                            // but [3], [5], [7] are also already processed => skip them
                            if (! context.keys.has(i)) {
                                // [2], [4], [6] => apply range or '*'
                                applyMatcherOrAny(i);
                            }
                        }
                        // [8..end] => apply range or '*'
                        for (let i = context.restAny; i < (json as any[]).length; i++) {
                            applyMatcherOrAny(i);
                        }
                    } else if (json && typeof json === 'object') {
                        for (const key in json) {
                            if ((! context.keys.has(key))) {
                                // apply regexp or '*'
                                applyMatcherOrAny(key);
                            }
                        }
                    }
                }
                // now, the host object
                if (selfMapper) {
                    // apply builder
                    return selfMapper.call(stack, json);
                } else {
                    // as-is
                    return json as any as Target;
                }
            } finally {
                stack.pop();
            }
        }

    }

    const toJSON = (mappers: Mappers<Reviver, any> | Reviver.Reference, recurse = true): any =>
        Object.fromEntries(
            Object.entries(mappers ?? {})
                // omit     {'.' : () => new ...}
                .filter(([key, mapper]) =>
                    typeof mapper === 'string'
                    // eslint-disable-next-line no-sparse-arrays
                    || (key !== ((mappers as any)[Mappers.Jokers.$] ?? [,'.'])[1]
                        && mapper instanceof Function &&
                            // a reviver       |   @Reviver class
                            (mapper[Mappers$] || ReviverAPI.get(mapper))
                        )
                    || typeof mapper === 'object'
                )
                // replace recursively the class refs by their qualified name,
                // because they might not have been replaced yet
                .map(([key, mapper]) =>
                    [key,
                    typeof mapper === 'string'
                        ? mapper
                        : mapper instanceof Reviver
                            ? mapper // internal.Reviver => unchanged because recurse to internal.Reviver.toJSON()
                            : mapper instanceof Function && ReviverAPI.get(mapper) // a class with @Reviver ???
                                ? Namespace.getQualifiedName(mapper) // => qname
                                : recurse
                                    ? toJSON(mapper) // just a mapper litteral => recurse
                                    : mapper // toJSON(m, false) NOT DEEP
                    ]
                )
        );

    // recompose the Stack for replacer()
    type Stack = {
        mapper: any, // Mappers, but with less constraints on keys
        key: string | number, // current key
        size: number, // number of remaining items for a level
                      // when 0 is reached : pop() from the stack
        count: number // increment for each json entry
    } & ({
            isArray: true,
            // mapping keys[], in order:
            keys: Keys[]
        } | {
            isArray: false
        })

    // arrays can have their mappers optimized :
    // consecutive indices that have the same mappings are merged in a range
    type Keys = {
        key: string, // indice or range, as a string
        from: number, // indice
        to?: number   //   or range
    }

    const UNMAPPED_KEYS = Symbol.for(`${namespace}.UnmappedKeys`); // used to collect keys that are not mapped

    /**
     * Replacer implementation
     * 
     * ## Internal detail
     * 
     * Things to be aware of :
     * 
     * ```
     * JSON.stringify(new Date(), (k, v) => console.log(k, v, typeof v, v instanceof Date))
     * 2021-05-18T14:01:10.995Z string false
     * ```
     * 
     * ...well, when the replacer is called with objects, the value passed is already
     * stringified, and this is definitively what we don't want. Therefore, for the root
     * there is a special handling directly in `JSON.stringify()`.
     * 
     * @see [[init]]
     */
    export class Replacer extends Function {

        end = false;
        mapper: Mappers<any> & { [UNMAPPED_KEYS]? : Set<string> } | undefined;
        stack: Stack[] = [];

        constructor() {
            super();
            // we have a wrapper around internal.Replacer
            // because this instance also has to be a function
            return new Proxy(this, {
                // the replacer function is
                //      fun(key, value): string
                apply(target, thisArg, argArray) {
                    const [key, value]: [string, any] = argArray as any;
                    return target.replace(key, value); // do it !
                }
            });
        }

        getReviver<Target>(): ReviverAPI<Target> | undefined {
            if (this.end) {
                return this.mapper
                    && Jsonizer.reviver<Target>(this.mapper as Mappers<Target>);
            } else {
                const Err = Errors.getClass('Illegal Access', true);
                throw new Err('This instance of replacer wasn\'t yet used in JSON.stringify()');
            }
        }

        isEmpty(): boolean {
            return ! this.mapper
                || Object.keys(this.mapper).length === 0;
        }

        /**
         * Initialize our Replacer with the root value to stringify.
         * 
         * @param root The value to stringify.
         * @param replacer If it is our Replacer, check if the root
         *      value class has a Reviver and set it as the 'Self' mapper.
         */
        static init(root: any, replacer?: Partial<Replacer>): (key: string, value: any) => any {
            if (replacer !== Jsonizer.REPLACER && replacer?.getReviver && root && ! isPrimitive(root)) {
                // lookup for the reviver here because it can't be captured later
                const qname = Replacer.getMapperQName(root);
                if (qname) {
                    replacer.mapper = {
                        '.': qname // ...and set it as the 'self' mapper
                    };
                    // nothing more is expected because {'.': 'Foo'} is enough
                    replacer.end = true;
                    // downgrade to something more simple
                    return Jsonizer.REPLACER; // won't track anything more
                } else {
                    // objects, arrays
                    replacer.mapper = {};
                }
            }
            // as-is, maybe a normal replacer
            return replacer as (this: any, key: string, value: any) => any;
        }

        static getMapperQName(value: any): any {
            if (value !== undefined) {
                const ctor = value.constructor; // get the class
                return ctor
                    && ctor !== Object
                    && ctor !== Array
                    && ReviverAPI.get(ctor) // if it has a Reviver...
                    && Namespace.getQualifiedName(ctor); // ... get its qname
            }
        }

        /**
         * Set a mapper on top of the stack. Primitives are not mapped.
         * The top of the stack has to be an object.
         */
        setMapper(key: string | number, value: any): void {
            const current = this.stack[this.stack.length -1];
            current.count++;
            if (typeof current.mapper === 'object') {
                if (isPrimitive(value)) {
                    // capture primitives in a Set
                    current.mapper[UNMAPPED_KEYS]!.add(key as string);
                } else {
                    const qname: string = Replacer.getMapperQName(value);
                    if (qname) {
                        if (current.isArray) { // array mappings optimization
                            // store keys as range when possible
                            if (current.keys.length === 0) {
                                current.keys.push({
                                    from: key as number,
                                    key: key = String(key)
                                });
                            } else {
                                const last = current.keys[current.keys.length -1];
                                const previousKey = last.key; // might be a range
                                // optimization can be made as one goes along
                                // only with Reviver qnames
                                // for other cases, see unstack() below
                                if (Math.max(last.from, last.to ?? 0) + 1 === key // adjacent only
                                    && current.mapper[previousKey] === qname
                                ) {
                                    delete current.mapper[previousKey]; // replace previous mapping
                                    // expand to range
                                    last.to = key as number; // updated in current.keys
                                    key = last.key = `${String(last.from)}-${String(last.to)}`
                                    // current.mapper[key] = qname; // new key
                                    current.count--; // counted in the range
                                } else {
                                    current.keys.push({
                                        from: key as number,
                                        key: key = String(key)
                                    });
                                }
                            }
                        }
                        current.mapper[key] = qname;
                    } else if (current.isArray) {
                        // else the key is bound to an object mapper {}, that might be populate later
                        current.keys.push({
                            from: key as number,
                            key: key = String(key)
                        });
                    }
                }
            }
        }

        /**
         * The actual 'replacer' function that will be invoked while
         * running `JSON.stringify()`
         */
        replace(key: string, value: any): any {
            if (this.end) {
                const Err = Errors.getClass('Illegal Access', true);
                throw new Err('This instance of replacer was already used in JSON.stringify(), please create a new one with Jsonizer.replacer()');
            }
            let check = true; // check whether we need to unstack
            try {
                const newMapper = () => {
                    const parent = this.stack.length > 0
                        ? this.stack[this.stack.length -1].mapper
                        : this.mapper
                    const mapper = typeof parent !== 'string'
                        && this.stack.length === 0
                            ? this.mapper
                            : {}
                        // else no further nested mapping needed : a qname ('string') is already set
                    const matchKey = this.stack.length === 0 || ! this.stack[this.stack.length -1].isArray
                        ? key
                        : Number(key);
                    const current = parent[key] // exact match
                        ?? Mappers.Matcher.getMatchingMapper(parent, matchKey) // regexp or range match
                    if (mapper !== parent
                        && (/*typeof parent[key] === 'object'  // might be boolan (false) or string (qname)
                            || parent[key] === undefined*/
                            current === undefined) // don't override
                    ) {
                        // attach to its parent
                        parent[key] = mapper;
                    }
                    if (typeof mapper === 'object' && ! mapper[UNMAPPED_KEYS]) {
                        mapper[UNMAPPED_KEYS] = new Set();
                    }
                    return mapper;
                }
                if (isPrimitive(value)) {
                    if (this.stack.length === 0) { // root
                        this.end = true;
                    }
                    return value;
                } else if (Array.isArray(value)) {
                    if (value.length > 0) {
                        const mapper = newMapper();
                        this.stack.push({
                            isArray: true,
                            mapper,
                            key, // this is the host key
                            size: value.length,
                            keys: [],
                            count: 0
                        });
                        check = false; // skip = prevent pop()
                        for (let i = 0; i < value.length; i++) {
                            // we can't set the mapper in the next call of replace(key: string, value: any)
                            // because value instances would be already stringified
                            // therefore we set it the upper level :
                            this.setMapper(i, value[i]);
                        }
                    }
                    return Jsonizer.REPLACER(key, value); // array can be subcast
                } else if (typeof value === 'object') {
                    const keys = new Set<string>();
                    for (const prop in value) {
                        if (Object.prototype.hasOwnProperty.call(value, prop)) { // eslint no-prototype-builtins
                            keys.add(prop);
                            if (keys.size === 1) { // to do once
                                const mapper = newMapper();
                                this.stack.push({
                                    isArray: false,
                                    mapper,
                                    key, // this is the host key
                                    size: 1, // increment later 🚩
                                    count: 0
                                });
                                check = false; // skip = prevent pop()
                            } else {
                                this.stack[this.stack.length -1].size++; // here 🚩
                            }
                            // we can't set the mapper in the next call of replace(key: string, value: any)
                            // because value instances would be already stringified
                            // therefore we set it the level above :
                            this.setMapper(prop, value[prop]);
                        }
                    }
                    return Jsonizer.REPLACER(key, value);
                } else {
                    return value; // function: left as-is
                    // will be set to null in [] or undefined and discarded in {}
                }
            } finally {
                const unStack = () => {
                    if (this.stack.length === 0) {
                        this.end = true;
                    } else {
                        const current = this.stack[this.stack.length -1];
                        current.size--;
                        if (current.size === 0) {
                            this.stack.pop(); // effective unstack
                            if (current.isArray) { // array mappings optimization
                                // optimizations on qname made on setMapper(), see above
                                let maybeTuple = true; // arbitrary heuristic
                                if (current.keys.length > 1) {
                                    // check consecutive mappings
                                    // the following optimization is for combined mappings
                                    // that are known on unstacking
                                    current.keys = current.keys.reduce<Keys[]>((prev, curr) => {
                                        if (curr.to) {
                                            maybeTuple = false; // a range is not a tuple
                                        }
                                        // can we compare with the previous ?
                                        if (prev.length > 0) {
                                            const other = prev[prev.length -1];
                                            const mapper = current.mapper[curr.key];
                                            function missings(key: string, mapperHas: any, mapperHasNot: any) {
                                                if (mapperHasNot[UNMAPPED_KEYS]?.has(key)) {
                                                    // don't merge if the key MUST NOT be mapped (it is a primitive)
                                                    return false;
                                                }
                                                // if some keys are missing, check wether they can be merge
                                                const submapper = Mappers.Matcher.getMatchingMapper(mapperHasNot, Number(key)) // range match
                                                    ?? mapperHasNot['*'] // any match (if defined)
                                                if (submapper) {
                                                    if (deepEquals(mapperHas[key], submapper, missings)) {
                                                        mapperHasNot[key] = submapper; // patch
                                                        return true;
                                                    } else {
                                                        return false;
                                                    }
                                                } else {
                                                    mapperHasNot[key] = mapperHas[key]; // patch
                                                    return true;
                                                }
                                            }
                                            if (Math.max(other.from, other.to ?? 0) + 1 === curr.from // adjacent only
                                                // check combined mappings equality
                                                && deepEquals(mapper, current.mapper[other.key], missings)
                                            ) {
                                                // merge unmapped keys
                                                for (const k of current.mapper[curr.key][UNMAPPED_KEYS]) {
                                                    mapper[UNMAPPED_KEYS].add(k);
                                                }
                                                // old mappers
                                                delete current.mapper[curr.key];
                                                delete current.mapper[other.key];
                                                // adjust
                                                current.count--;
                                                // merge
                                                other.to = curr.to ?? curr.from;
                                                other.key = `${other.from}-${other.to}`;
                                                // new mapper
                                                current.mapper[other.key] = mapper;
                                                maybeTuple = false;
                                            } else {
                                                prev.push(curr); // unchanged
                                            }
                                        } else {
                                            prev.push(curr); // first item
                                        }
                                        return prev;
                                    }, []);
                                    // current.keys are up to date
                                }
                                // the last is (almost) always the 'Any' key
                                if (current.keys.length > 0
                                    // no holes in the sequence (otherwise, some keys ARE NOT mapped)
                                    && current.keys.length === current.count
                                    // keep tuples as-is, for (arbitrary) convenience
                                    // (tuples are assumed to have more than one items without 2 equals consecutive items)
                                    && (current.keys.length === 1 || ! maybeTuple)
                                ) {
                                    const lastKey = current.keys[current.keys.length -1].key;
                                    current.mapper['*'] = current.mapper[lastKey];
                                    delete current.mapper[lastKey];
                                }
                            }
                            // final cleanup: prune empty mappings
                            for (const key in current.mapper) {
                                const sub = current.mapper[key];
                                if (typeof sub === 'boolean'
                                    || (typeof sub === 'object' && Object.keys(sub).length === 0)
                                ) {
                                    delete current.mapper[key];
                                }
                            }
                            unStack();
                            if (this.stack.length === 0) {
                                this.end = true;
                            }
                        } // else level not yet finished, let it in the stack
                    }
                }
                if (check) {
                    unStack();
                }
            }
        }

        toString(): string {
            return (this.mapper
                && JSON.stringify(
                    toJSON(this.mapper)
                )
            )!;
        }
    }
}

// final wire up
// must be at the end because it refers @Reviver

const ReviverAPI = Reviver;
type ReviverAPI<Target> = Reviver<Target>;

/**
 * A replacement function of `JSON.stringify()`.
 * 
 * > For internal use only, except if you see such a warning in the console :
 * > ```
 * > "Unable to patch JSON.stringify(), use stringify() instead"
 * > ```
 * > then use this function instead of `JSON.stringify()`.
 * 
 * ## Note
 * 
 * This function is just a wrapper around `JSON.stringify()`
 * used to handle properly the root element.
 */
 export function stringify(
    // stringify(value: any, replacer?: (this: any, key: string, value: any) => any, space?: string | number): string;
    // stringify(value: any, replacer?: (number | string)[] | null, space?: string | number): string;
    value: any,
    replacer?: (number | string)[] | ((this: any, key: string, value: any) => any) | null | undefined,
    space?: string | number | undefined): string
{
    if ((replacer as Reviver)?.revive) {
        throw new TypeError('Unable to stringify with a reviver ; please pass a replacer instead');
    }
    // patching JSON.stringify() :
    //    - if our Replacer is supplied, handle properly the root value
    //              (because the original data can't be handled elsewhere:
    //                  its toJSON() will be already call)
    //    - else not our concern
    replacer = internal.Replacer.init(value, replacer as Replacer);
    if (replacer === Jsonizer.REPLACER) {
        value = replacer('', value);
    }
    // go !
    return jsonStringify(value, replacer, space);
}

const jsonStringify = JSON.stringify;
try {
    // be smart with environments that would have lock some things...
    JSON.stringify = stringify;
} catch (err) {
    console.warn('Unable to patch JSON.stringify(), use stringify() instead', err);
}

// final wiring, can't be used as class decorators on themselves

Namespace(Jsonizer.NAMESPACE)(internal.Reviver);
Reviver<internal.Reviver, Mappers<internal.Reviver, any>>({
    '.': mappers => new internal.Reviver(mappers) // Jsonizer.reviver(mappers)
})(internal.Reviver);

Namespace(Jsonizer.NAMESPACE)(internal.Replacer); // useless, but aligned

Namespace(Jsonizer.NAMESPACE)(Jsonizer.Self.Identity);
Reviver<any>({
    '.': any => any
})(Jsonizer.Self.Identity);
