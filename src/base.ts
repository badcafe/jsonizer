/**
 * Base
 * 
 * @module
 */
import type { Errors as Err } from "./errors";

/** The Jsonizer namespace is `npm:@badcafe/jsonizer` */
export const namespace = 'npm:@badcafe/jsonizer';

// just to avoid circular dependencies
export const Errors: typeof Err = {} as any;
// set in errors.ts, used by namespace.ts

/**
 * Any class, including abstract classes.
 * 
 * @paramType Type - The class type
 * @paramType Args - The arguments of the constructor
 */
export type Class<Type = any, Args extends any[] = any[]> = Class.Concrete<Type, Args> | Class.Abstract<Type>

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
     * @param fun The actual class or function
     * @param name The name to set
     * @returns The class itself if it already has the expected name,
     *      or a wrapper around with the relevant name.
     */
    export function rename<F extends Class | Function>(fun: F, name: string): F {
        return fun.name === name
            ? fun
            : new Proxy(fun, {
                get(target: any, prop: PropertyKey, receiver: any): any {
                    const val = Reflect.get(target, prop, receiver);
                    return prop === 'name'
                        ? name
                        : val
                }
            });
    }

}
