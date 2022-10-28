// Errors are a bit special because they may not be under control
// of the user app code, for example when using a third-party
// library ; developpers don't want to check in every dependency
// whether custom error classes are thrown
// So, just handle them

import { namespace, Errors as ErrorsRef, Class } from './base'; // 'npm:@badcafe/jsonizer'

import { Namespace } from "./namespace";

/** Errors utilities */
export namespace Errors {

    /** Built-in error classes */
    export const errors = {
        Error,
        EvalError,
        RangeError,
        ReferenceError,
        SyntaxError,
        TypeError,
        URIError
    } as const;

    /** Built-in error class names */
    export type errors = keyof typeof errors;

    const CODE: unique symbol = Symbol.for(`${namespace}.ErrorCode`);

    type HasCode = {
        [CODE]?: string | number
    };

    /**
     * An error may define additional custom properties.
     */
    export interface TypedError<Type = unknown> extends ErrorConstructor {
        new(message?: string): Type & Error
    }

    // Err classes that are generated
    const classes = new Map<string, TypedError & HasCode>();

    /**
     * Dynamically create a user error class with the name given.
     * 
     * @param name The name of the class.
     * @param unique if `true` (by default), a singleton with that
     *      name will be returned ; if `false`, a new class will be returned
     *      if that name was not previously used to define a singleton.
     * @param code Conveniently, an error code may be bound to the class,
     *      because it is a common practice. If a code is defined, the singleton
     *      must have the same code, otherwise another class will be generated.
     * @paramType Type - Additional custom properties (optional) allowed in the error.
     *      The properties can be set after calling `new`.
     * @returns An error class
     * 
     * @see [[getCode]]
     * @see [[getName]]
     */
    export function getClass<Type = unknown>(
        name: string,
        unique = true,
        code?: string | number
    ): TypedError<Type> {
        let Err: HasCode & TypedError<Type> = classes.get(name)! as any;
        if (Err) {
            if (code && ! Err[CODE]) {
                Err[CODE] = code;
            }
            if (code === undefined || Err[CODE] === code) {
                return Err;
            }
        }
        Err = {
            // the class will endorse the name of the property it is assigned to
            [name]: class extends Error {
                constructor(message?: string) {
                    super(message);
                }
            }
        }[name] as TypedError<Type> & HasCode;
        Err = Class.rename(Err, name); // ensure webpack didn't cancel the naming effect
        if (code !== undefined) {
            Err[CODE] = code;
        }
        if (unique) {
            classes.set(name, Err);
        }
        return Err;
    }

    /**
     * If the error class was created dynamically,
     * return the error code if one was supplied.
     * 
     * @param error The error class or instance
     * @returns Its error code
     * @paramType Code - Downcast the error code.
     * 
     * @see [[getClass]]
     */
     export function getCode<Code = string | number | undefined>(error: Error | ErrorConstructor): Code {
        if (error instanceof Error) {
            error = error.constructor as ErrorConstructor;
        }
        return (error as unknown as HasCode)[CODE] as any as Code;
    }

    /**
     * Return the name of an error.
     * 
     * @param error The error class or instance
     * @returns Its name
     * 
     * @see [[getClass]]
     */
    export function getName(error: Error | ErrorConstructor): string {
        if (error instanceof Error) {
            error = error.constructor as ErrorConstructor;
        }
        return error.name;
    }

    /**
     * Indicates whether a class is an Error class,
     * that is to say extends Error.
     * 
     * @param err The error class to test.
     */
    export function isError(err: Class): boolean {
        return err
            ? err === Error
                ? true
                : isError(Object.getPrototypeOf(err))
                          // not the same as err.prototype
            : false;
    }

}

// just to have refs that work ; see base.ts
Object.assign(ErrorsRef, Errors);

for (const err in Errors.errors) {
    const cl = Errors.errors[err as Errors.errors];
    // errors are special : send a hidden arg to prevent setting error.ErrXXX
    Namespace.registerClassByQualifiedName.apply(null, [err, cl, true] as any);
}
