import { Errors, Jsonizer, Reviver } from "../src";

describe('Errors', () => {
    describe('reviving', () => {
        test('Error', async () => {
            const msg = 'Oops !';
            const err = new Error(msg);
            expect(String(err)).toBe(`Error: ${msg}`);
            let jsonErr = JSON.stringify(err);
            expect(jsonErr).toBe(`{}`);
            jsonErr = JSON.stringify(err, Jsonizer.REPLACER);
            expect(jsonErr).toBe(`"Error: ${msg}"`);
            const jsonReviver = '{".":"Error"}';
            const reviver = JSON.parse(jsonReviver, Reviver.get<Reviver<Error>>());
            const errFromJson = JSON.parse(jsonErr, reviver);
            expect(errFromJson).toBeInstanceOf(Error);
            expect(errFromJson.name).toBe('Error');
            expect(errFromJson.message).toBe(msg);
            expect(String(errFromJson)).toBe(String(err));
            expect(JSON.stringify(errFromJson, Jsonizer.REPLACER)).toBe(jsonErr);
        });
        test('TypeError', async () => {
            const msg = 'Oops !';
            const err = new TypeError(msg);
            expect(String(err)).toBe(`TypeError: ${msg}`); // built-in errors are not rendered the same way as custom errors
            let jsonErr = JSON.stringify(err);
            expect(jsonErr).toBe(`{}`);
            jsonErr = JSON.stringify(err, Jsonizer.REPLACER);
            expect(jsonErr).toBe(`"TypeError: ${msg}"`);
            const jsonReviver = '{".":"TypeError"}';
            const reviver = JSON.parse(jsonReviver, Reviver.get<Reviver<TypeError>>());
            const errFromJson = JSON.parse(jsonErr, reviver);
            expect(errFromJson).toBeInstanceOf(TypeError);
            expect(errFromJson.name).toBe('TypeError');
            expect(errFromJson.message).toBe(msg);
            expect(String(errFromJson)).toBe(String(err));
            expect(JSON.stringify(errFromJson, Jsonizer.REPLACER)).toBe(jsonErr);
        });
        test('MyError', async () => {
            // it is an unregistered error !
            type Desc = { description: string };
            const MyError = Errors.getClass<Desc>('MyError');
            const msg = 'Oops !';
            const err = new MyError(msg);
            expect(String(err)).toBe(`Error: ${msg}`);
            err.description = 'This is my error';
            let jsonErr = JSON.stringify(err);
            expect(jsonErr).toBe(`{\"description\":\"This is my error\"}`);
            let strErr = String(err);
            expect(strErr).toBe(`Error: ${msg}`);

            const replacer = Jsonizer.replacer();
            jsonErr = JSON.stringify(err, replacer);
            expect(jsonErr).toBe(`"MyError: ${msg}"`);
            expect(replacer.toString()).toBe('{".":"MyError"}');

            const jsonReviver = '{".":"MyError"}'; // falls back to Error
            const reviver = JSON.parse(jsonReviver, Reviver.get<Reviver<Desc & Error>>());
            const errFromJson = JSON.parse(jsonErr, reviver);
            expect(errFromJson).toBeInstanceOf(Error);
            expect(errFromJson.name).toBe('Error'); // curiously, this is the instance name of custom errors
            expect(errFromJson.constructor.name).toBe('MyError');
            expect(errFromJson.message).toBe(msg);
            expect(String(errFromJson)).toBe(String(err));
            expect(JSON.stringify(errFromJson, Jsonizer.REPLACER)).toBe(jsonErr);
        });
        test('MyWarning', async () => {
            // it is an unregistered error !
            // the class doesn't end with 'Error'
            type Desc = { description: string };
            class MyWarning extends Error implements Desc {
                description = 'This is my warning';
                constructor(msg: string) {
                    super(msg);
                }
            }
            const msg = 'Oops !';
            const err = new MyWarning(msg);
            expect(String(err)).toBe(`Error: ${msg}`);
            let jsonErr = JSON.stringify(err);
            expect(jsonErr).toBe(`{\"description\":\"This is my warning\"}`);

            const replacer = Jsonizer.replacer();
            jsonErr = JSON.stringify(err, replacer);
            expect(jsonErr).toBe(`"MyWarning: ${msg}"`);
            expect(replacer.toString()).toBe('{".":"Error"}');

            const jsonReviver = '{".":"Error"}'; // falls back to Error
            const reviver = JSON.parse(jsonReviver, Reviver.get<Reviver<MyWarning>>());
            const errFromJson = JSON.parse(jsonErr, reviver);
            expect(errFromJson).toBeInstanceOf(Error);
            expect(errFromJson.name).toBe('Error'); // curiously, this is the instance name of custom errors
            expect(errFromJson.constructor.name).toBe('MyWarning');
            expect(errFromJson.message).toBe(msg);
            expect(String(errFromJson)).toBe(String(err));
            expect(JSON.stringify(errFromJson, Jsonizer.REPLACER)).toBe(jsonErr);
        });

        test('503 Service Unavailable', async () => {
            type Desc = { description: string };
            const HttpErr = Errors.getClass<Desc>('Service Unavailable', true, 503);
            const msg = 'Oops !';
            const err = new HttpErr(msg);
            err.description = 'The 503 (Service Unavailable) status code indicates that the server '
                + 'is currently unable to handle the request due to a temporary overload '
                + 'or scheduled maintenance, which will likely be alleviated after some delay.';
            expect(String(err)).toBe(`Error: ${msg}`);
            expect(err.name).toBe('Error');
            expect(err.constructor.name).toBe('Service Unavailable');
            expect(Errors.getName(err)).toBe('Service Unavailable');
            expect(Errors.getCode(err)).toBe(503);
            let jsonErr = JSON.stringify(err);
            expect(jsonErr).toBe(`{\"description\":\"${err.description}\"}`);

            const replacer = Jsonizer.replacer();
            jsonErr = JSON.stringify(err, replacer);
            expect(jsonErr).toBe(`"Service Unavailable: ${msg}"`);
            expect(replacer.toString()).toBe('{".":"Error"}');

            const jsonReviver = '{".":"Error"}'; // falls back to Error
            const reviver = JSON.parse(jsonReviver, Reviver.get<Reviver<Desc & Error>>());
            const errFromJson = JSON.parse(jsonErr, reviver);
            expect(errFromJson).toBeInstanceOf(Error);
            expect(errFromJson.name).toBe('Error'); // curiously, this is the instance name of custom errors
            expect(errFromJson.constructor.name).toBe('Service Unavailable');
            expect(Errors.getName(errFromJson)).toBe('Service Unavailable');
            expect(errFromJson.message).toBe(msg);
            expect(Errors.getCode(errFromJson)).toBe(503);
            expect(String(errFromJson)).toBe(String(err));
            expect(JSON.stringify(errFromJson, Jsonizer.REPLACER)).toBe(jsonErr);
        });

        test('null', () => {
            const errFromJson = JSON.parse('null', Reviver.get(Error));
            expect(errFromJson).toBeNull();
        });
    });

});
