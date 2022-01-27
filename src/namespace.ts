/**
 * ## Hold the registry of classes
 * 
 * The purpose of Jsonizer's namespaces is to let classes **knowing** their
 * fully qualified name.
 * 
 * > Javascript and Typescript can group items together under namespaces,
 * > which lead roughly to a hierarchy of objects, but the items themselves
 * > when they are classes don't have the knowledge of the hierarchy they
 * > belong to.
 * 
 * Each class has its own identity but in order **to refer them**
 * by name properly it is necessary to introduce namespaces.
 * 
 * A namespace is mandatory for example to refer 2 classes
 * with the same name, e.g. `Category` (of a product) and
 * `Category` (of a movie).
 * 
 * A namespace have to be unique within an application, therefore
 * classes that are designed to be exposed in a library should
 * be decorated with a universal unique namespace identifier,
 * e.g. `org.example.myApp`. Conversely, it is enough for
 * a standalone application to group subordinate classes
 * together using relative namespaces.
 * 
 * * using a universal unique namespace identifier :
 * ```
 * ⓐNamespace('org.example.myApp')
 * class Foo {}
 *      // 👆 qualified name set to 'org.example.myApp.Foo'
 * ```
 * * using relative namespaces :
 * ```
 * ⓐNamespace(Product)
 * class Category {}
 *      // 👆 qualified name set to 'Product.Category'
 * ```
 * * 
 * ```
 * ⓐNamespace(Movie)
 * class Category {}
 *      // 👆 qualified name set to 'Movie.Category'
 * ```
 * 
 * In the example above, even if an app imports 2 classes
 * with the same name `Product`, it is still possible to
 * relocate one (or both) of them :
 * 
 * ```
 * import { Product as Product1 } from './myApp';
 * import { Product as Product2 } from 'someLib';
 * ⓐNamespace('org.example.myApp')(Product1)
 *     // qualified name               👆
 *     // set to 'org.example.myApp.Product' 
 * ⓐNamespace('com.example.products')(Product2)
 *     // qualified name                  👆
 *     // set to 'com.example.products.Product' 
 * ```
 * 
 * By transitivity, the `Category` is relocated to
 * `org.example.myApp.Product.Category`
 * 
 * > ℹ️  This is unrelated to Typescript namespaces !
 * 
 * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=namespaces)
 * 
 * ## Code splitting (lazy loading)
 * 
 * Modern Javascript bundlers allow in some circumstances
 * to split the code in several files that will be loaded
 * on demand (client side).
 *
 * Ensure that the code that do register each class is
 * visited before any registry lookup, otherwise you
 * might have mismatch lookups.
 * 
 * Typically, this can be done by importing them in the
 * app entry point.
 * 
 * @module
 */
import 'reflect-metadata';
import { namespace, Errors, Class } from './base'; // 'npm:@badcafe/jsonizer'

/**
 * Decorator that defines the namespace of a class, and
 * registers it for later lookup by name.
 * 
 * In case of conflict, classes can be relocated by using
 * this function not as a decorator, but as a normal function.
 * 
 * > ℹ️  This is unrelated to Typescript namespaces ! 
 * 
 * ## Usage as a decorator
 * 
 * ```
 * ⓐNamespace('org.example.myApp')
 * class Foo {}
 *     // 👆 qualified name set to 'org.example.myApp.Foo'
 * 
 * // setting a relative namespace :
 * ⓐNamespace(Foo)
 * class Bar {}
 *     // 👆 qualified name set to 'org.example.myApp.Foo.Bar'
 * 
 * class Baz {}
 *
 * ⓐNamespace(Baz)
 * class Qux {}
 *     // 👆 qualified name set to 'Baz.Qux'
 * ```
 * 
 * ## Usage as a function
 * 
 * ```
 * // setting a namespace to an existing class :
 * import { Quux } from 'quuxLib';
 * Namespace('org.example.myApp')(Quux)
 *                              // 👆 qualified name set to
 *                              // 'org.example.myApp.Quux'
 * 
 * // relocating a class
 * Namespace('org.example.myApp')(Baz)
 *                              // 👆 qualified name set to
 *                              // 'org.example.myApp.Baz'
 * // and incidentally, Qux subordinate qualified name
 * //                       set to 'org.example.myApp.Baz.Qux'
 * 
 * ```
 * 
 * ## Default namespace
 * 
 * ```
 * ⓐNamespace('')
 * class Corge {}
 *     // 👆 qualified name set to 'Corge'
 * ```
 * 
 * @see [[Namespace.getClass]]
 * @see [[Namespace.getQualifiedName]]
 * @see [User guide](https://badcafe.github.io/jsonizer/#/README?id=namespaces)
 */
export function Namespace(ns: Class | string): (target: Class) => void {
    return (target: Class) => {
        // remove previous qname from registry
        unregisterClass(target);
        // new qname
        Reflect.defineMetadata(Namespace.$, ns, target);
        const qn = Namespace.getQualifiedName(target);
        // new entries in registry
        registerClassByQualifiedName(qn, target);
    }
}

const registry = new Map<string, Class[]>();

function unregisterClass(target: Class) {
    const qn = Namespace.getQualifiedName(target)
    const cl = registry.get(qn);
    if (cl) {
        const i = cl.findIndex(o => o === target);
        if (i !== -1) {
            cl.splice(i, 1); // done !
        }
    }
}

function registerClassByQualifiedName(qn: string, target: Class) {
    // new entries in registry
    const classes = registry.get(qn);
    if (! classes) {
        registry.set(qn, [target]);
    } else if (! classes?.includes(target)) {
        classes?.push(target);
    } // else same class already registered
}

export namespace Namespace {

    /**
     * Metadata key.
     */
    export const $ = Symbol.for(`${namespace}.Namespace`);

    /**
     * Indicates whether a class has a namespace or not.
     * 
     * @param target The target class.
     */
    export function hasNamespace(target: object): boolean {
        return Reflect.hasMetadata(Namespace.$, target);
    }

    /**
     * Return the qualified name of a class.
     * 
     * @param target The target class.
     * @returns Its name preceded by its namespace, if any.
     */
    export function getQualifiedName(target: Class): string {
        const ns = Reflect.getMetadata(Namespace.$, target);
        if (typeof ns === 'string' && ns.length > 0) {
            return `${ns}.${target.name}`;
        } else if (ns) {
            return `${getQualifiedName(ns)}.${target.name}`;
        } else {
            const qname = target.name;
            return (Errors.isError(target) && ! qname.endsWith('Error'))
                ? 'Error' // fallback
                : qname;
        }
    }

    /**
     * Lookup for a class by name
     * 
     * @param qname The qualified name of the class.
     * @returns The class bound to that name.
     * @throws `Name Conflict` error when several classes are found :
     *      can be fix by setting 2 different namespaces to the classes.
     * @throws `Missing Name` error when the class is not found in the registry.
     */
    export function getClass<T>(qname: string): Class<T> {
        const cl = registry.get(qname);
        // we don't rise errors on registration but on invokation,
        // because one must let the user rearrange its namespaces as wanted
        if (cl) {
            if (cl.length > 1) {
                const Err = Errors.getClass('Name Conflict', true, 409);
                throw new Err(`"${qname}" was registered ${cl.length === 2 ? 'twice' : `${cl.length} times`
                    }. Consider declaring "Namespace()" on the classes.`);
            }
            return cl[0];
        } else if (qname.endsWith('Error')) {
            // custom errors might not be registered, go with it
            return Error as any;
        } else {
            const Err = Errors.getClass('Missing Name', true, 404);
            throw new Err(`"${qname}" not found in registry`);
        }
    }

    /**
     * ## For advanced usage only
     * 
     * Unregisters a class from the registry.
     * 
     * Should never be used, except for classes that would be managed
     * dynamically with a life-span controlled by the user.
     */
    export declare function unregisterClass(target: Class): void;

    /**
     * ## For advanced usage only
     * 
     * Do not use : use instead `Namespace(theClass)`.
     * 
     * Force to register a class in the registry by a given name.
     * 
     * Should never be used, except for classes that would be managed
     * dynamically with a life-span controlled by the user.
     */
     export declare function registerClassByQualifiedName(qn: string, target: Class): void

}

Namespace.unregisterClass = unregisterClass;
Namespace.registerClassByQualifiedName = registerClassByQualifiedName;