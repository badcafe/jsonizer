/**
 * Base
 * 
 * @module
 */
// !!! ensure to import types only from "./errors" and "./namespace"
import type { Errors as Err } from "./errors";
import type { Namespace } from "./namespace";

/** The Jsonizer namespace is `npm:@badcafe/jsonizer` */
export const namespace = 'npm:@badcafe/jsonizer';

// just to avoid circular dependencies
export const Errors: typeof Err = {} as any;
// set in errors.ts, used by namespace.ts

// just to avoid circular dependencies
let NsService: typeof Namespace;
export function setNamespaceService(nsService: typeof Namespace) {
    NsService = nsService;
}
// set in namespace.ts

/**
 * Any class, including abstract classes.
 * 
 * @paramType Type - The class type
 * @paramType Args - The arguments of the constructor
 */
export type Class<Type = any, Args extends any[] = any[]> = Class.Concrete<Type, Args> | Class.Abstract<Type>

// for placeholder classes created from a string namespace
// a string class IS NOT the same as a regular class
export const IS_STRING = Symbol.for(`${namespace}.Class.IsString`);
export const CHILDREN = Symbol.for(`${namespace}.Class.Children`);
export type Ext = {
    [CHILDREN]?: Class[]
    [IS_STRING]?: true
}

/**
 * Abstract and Concrete classes.
 */
export namespace Class {

    /**
     * Any concrete class, that is to say not abstract.
     */
    export type Concrete<Type = any, Args extends any[] = any[]> = {
        new(...args: Args): Type
    }

    /**
     * Any abstract class.
     */
    export type Abstract<Type = any> = {
        name: string,
        prototype: Type
    }

    /**
     * Set a name to a class or function, if necessary.
     * 
     * > Helpful after creating a class or function with a
     * > dynamic name, some bundlers are somewhat destructive.
     * 
     * If a wrapper is created, they differ by their namespace
     * and the children of the orginal are moved to the wrapper.
     * 
     * @param fun The actual class or function
     * @param name The name to set
     * @returns The class itself if it already has the expected name,
     *      or a wrapper around with the relevant name.
     */
    export function rename<F extends (Class | Function) & Ext>(fun: F & EXT_shader_texture_lod, name: string): F {
        if (fun.name === name) {
            return fun;
        } else if (fun[IS_STRING]) {
            throw new TypeError(`${fun.name}'s name is locked and can't be renamed to "${name}"`);
        } else {
            const ns = Reflect.getMetadata(NsService.$, fun);
            if (ns !== undefined) {
                NsService('')(fun)
            }
            // make a copy
            const children = [...fun[CHILDREN] ?? []];
            delete fun[CHILDREN];
            const wrapped = new Proxy(fun, {
                get(target: any, prop: PropertyKey, receiver: any): any {
                    return prop === 'name'
                        ? name
                        : prop === CHILDREN
                            ? children
                            : Reflect.get(target, prop, receiver);
                }
            });
            for (const child of children) {
                Reflect.defineMetadata(NsService.$, wrapped, child);
            }
            if (ns !== undefined) {
                NsService(ns)(wrapped);
            }
            return wrapped;
        }
    }

}
