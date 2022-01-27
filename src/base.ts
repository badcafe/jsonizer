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

}
