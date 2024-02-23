import { Namespace, Reviver } from "../src";

describe('`@badcafe/ts-plugin`', () => {
    test('Should compile without the plugin', () => {
        interface IPerson {
            name: string
            birthDate: Date
        }
        expect(() => {
            // compile OK but can't run without @badcafe/ts-plugin
            Namespace<IPerson>('org.example.app')();
        }).toThrow(TypeError);
        expect(() => {
            // compile OK but can't run without @badcafe/ts-plugin
            const IPerson = Reviver<IPerson>({
                birthDate: Date
            })();
            console.log(IPerson);
        }).toThrow(TypeError);
    })
});
