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
import { namespace, Errors, Class, Ext, IS_STRING, CHILDREN, setNamespaceService } from './base'; // 'npm:@badcafe/jsonizer'

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
export function Namespace<Target>(
    ns: Class & Ext | string
): <Type extends null | Class = null>(target?: Type) => Type extends null
    ? Class<Target> // when omitted, return the generated class
    : void // when used as decorator
{
    return ((target: Class & Ext) => {
        if (! target) {
            throw new TypeError('Missing Namespace target ; pass a class or see @badcafe/ts-plugin');
        }
        // remove previous qname from registry
        unregisterClass(target);
        unregisterTree(target);
        if (typeof ns === 'string' && ns.length > 0) {
            // org.example.Foo => create 3 classes in the hierarchy
            // but a string class IS NOT the same as a regular class
            // "Foo" must not be the class Foo
            // this is why there is the flag to distinguish them
            // Moreover, they can't be renamed (they are string based !)
            ns = ns.split('.').reduce((parent, name) => {
                let cl = registry.get(name)?.find(cl => cl[IS_STRING]);
                if (! cl) {
                    const clazz = {
                        // the class will endorse the name of the property it is assigned to
                        [ns as string]: class {}
                    }[ns as string];
                    cl = Class.rename(clazz, ns as string); // ensure the name is correct
                    cl[IS_STRING] = true; // then locks the class name
                }
                if (parent) {
                    parent.hasOwnProperty(CHILDREN)
                        ? parent[CHILDREN]!.push(cl)
                        : (parent[CHILDREN] = [cl]);
                }        
                return cl!;
            }, undefined as any as Class & Ext);
        }
        if (typeof ns !== 'string') {
            ns.hasOwnProperty(CHILDREN)
                ? ns[CHILDREN]!.push(target)
                : (ns[CHILDREN] = [target]);
        } // else ns is ''
        // new qname
        Reflect.defineMetadata(Namespace.$, ns, target);
        const qn = Namespace.getQualifiedName(target);
        // new entries in registry
        registerClass(qn, target);
        registerTree(target);
        return target; // when not used as a decorator,
                       // for getting back a generated class (see @badcafe/ts-plugin)
    }) as any
}

const REGISTRY = Symbol.for(`${namespace}.Namespace.Registry`);

// declare global {
//     var [REGISTRY]: Map<string, (Class & HasChildren)[]>
// }
// makes the registry global, since the library might be loaded multiple times
const registry: Map<string, (Class & Ext)[]> = (globalThis as any)[REGISTRY]
    ?? ((globalThis as any)[REGISTRY] = new Map());

function unregisterTree(target: Class & Ext) {
    for (const child of target.hasOwnProperty(CHILDREN) ? target[CHILDREN]! : []) {
        unregisterClass(child);
        unregisterTree(child);
    }
}

function unregisterClass(target: Class) {
    const qn = Namespace.getQualifiedName(target)
    const cl = registry.get(qn);
    if (cl) {
        const i = cl.findIndex(o => o === target);
        if (i !== -1) {
            if (cl.length === 1) {
                registry.delete(qn);
            } else {
                cl.splice(i, 1);
            }
        }
    } // else not a registered class
}

function registerTree(target: Class & Ext) {
    for (const child of target.hasOwnProperty(CHILDREN) ? target[CHILDREN]! : []) {
        const qn = Namespace.getQualifiedName(child);
        registerClass(qn, child);
        registerTree(child);
    }
}

function registerClass(qn: string, target: Class) {
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
            return (Errors.isError(target) && ! Namespace.hasClass(qname)) 
                ? 'error.' + qname // fallback if not a standard error
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
        const cl = hasClass<T>(qname);
        if (cl) {
            return cl;
        } else {
            const Err = Errors.getClass('Not Found', true, 404);
            throw new Err(`"${qname}" not found in registry`);
        }
    }

    /**
     * Lookup for a class by name.
     * 
     * @param qname The qualified name of the class.
     * @returns The class bound to that name.
     * @throws `Name Conflict` error when several classes are found :
     *      can be fix by setting 2 different namespaces to the classes.
     */
    export function hasClass<T>(qname: string): Class<T> | undefined {
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
        } else if (qname.startsWith('error.')) {
            // custom errors might not be registered, go with it
            return Error as any;
        }
    }

    /**
     * Deduplicate a name in the namespace registry.
     * 
     * If there are several entries bound to the given
     * qualified name, they are considered similar and
     * the first is kept.
     * 
     * > When each class has a unique qualified name,
     * > this won't happen. When it happens, it has to
     * > be fixed by setting different qualified names.
     * > When it still happens, it's because the library
     * > is loaded several times ; in that case, the
     * > registry is still unique but duplicates may
     * > be found, typically for internal classes (this
     * > function was designed for them, you ought NOT
     * > use it).
     * 
     * @param qname The qualified name to deduplicate if necessary.
     */
    export function dedup(qname: string) {
        const cl = registry.get(qname);
        if (cl && cl.length > 1) {
            cl.length = 1;
        }
    }

    /**
     * Dump the namespace registry ; if an entry contains
     * duplicates, throws an error.
     * 
     * Useful after all `@Namespace`s have been set.
     * 
     * @param noFail Don't throw an error.
     */
    export function* checkIntegrity(noFail = true) {
        for (const entry of registry) {
            if (entry[1].length > 1) {
                const err = new Error(`A qualified name must be bound to a single class, "${entry[0]}" is bound to ${entry[1].length} classes`);
                if (! noFail) {
                    throw err;
                }
                console.error(err);
                yield [entry[0], ...entry[1]] as const;
            }
            yield [entry[0], entry[1][0]] as const;
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
    export function registerClassByQualifiedName(qn: string, target: Class): void {
        // 'a.b.C' => 'a.b' ; 'C' => ''
        const pkg = qn.split('.').slice(0, -1).join('.');
        if (pkg.length > 0) {
            const parent = Namespace.hasClass(pkg);
            if (parent) {
                Namespace(parent)(target);
            } else {
                Namespace(pkg)(target);
            }
        } else if (arguments[2]) { // this is a hidden argument used in error.ts (at the end)
            // just for bootstraping JS errors otherwise they will be in the 'error' ns
            // (chicken - egg workaround)
            Reflect.defineMetadata(Namespace.$, '', target);
            registerClass(qn, target);
            // do the same as Namespace('')(target)
            // without having a name set to error.XXXError
        } else {
            Namespace('')(target);
        }
    }

}

function unregisterClassTree(target: Class) {
    unregisterClass(target);
    unregisterTree(target);
    registerTree(target);
}

Namespace.unregisterClass = unregisterClassTree;

// just to have refs that work ; see base.ts
setNamespaceService(Namespace);

/*

{class, string}, e.g. {a, "a"} are not the same, but lead to the same qname
b, b' are different classes but with the same name b

Understanding remapping :

1) Start :
                         ┌──REGISTRY──┐
    TREES               QNAME        CLASSES

"z"┬"a"─ b'             z.a          [a]
   |                    z.a.b        [b, b'] <= !!!
   └ a ┬ b ┬ c          z.a.b.c      [c]
       |   └ d          z.a.b.d      [d]
       └ e              z.a.e        [e]

2) Cut b from a :

"z"┬"a"─ b'             z.a          [a]
   |                    z.a.b        [b']
   └ a ─ e              z.a.e        [e]
                        b            [b]
 b ┬ c                  b.c          [c]
   └ d                  b.d          [d]

3) Paste b to e :

"z"┬"a"─ b'             z.a          [a]
   |                    z.a.b        [b']
   └ a ─ e ─ b ┬ c      z.a.e        [e]
               └ d      z.a.e.b      [b]
                        z.a.e.b.c    [c]
                        z.a.e.b.d    [d]

*/
