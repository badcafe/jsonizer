import { Jsonizer, Reviver, Namespace } from "../src";
import { namespace } from "../src/base";

type BufferDTO = ReturnType<typeof Buffer.prototype.toJSON>
Reviver<Buffer, BufferDTO>({
    '.': ({ data }) => Buffer.from(data)
})(Buffer);

describe('Stringify with Jsonizer.replacer() gives the expected mapper', () => {
    describe('with built-in type', () => {
        test('Date', async () => {
            const replacer = Jsonizer.replacer<Date>();
            const now = new Date();
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{".":"Date"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
        test('[Date]', async () => {
            const replacer = Jsonizer.replacer<Date[]>();
            const now = [new Date()];
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{"*":"Date"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
        test('{d: Date}', async () => {
            const replacer = Jsonizer.replacer<{ d: Date }>();
            const now = { d: new Date() };
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{"d":"Date"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
    });
    describe('with custom class', () => {
        @Reviver<Foo>({
            '.': () => new Foo()
        })
        class Foo { }
        test('Foo', async () => {
            const replacer = Jsonizer.replacer<Foo>();
            const foo = new Foo();
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{".":"Foo"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
        test('[Foo]', async () => {
            const replacer = Jsonizer.replacer<Foo[]>();
            const foo = [new Foo()];
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{"*":"Foo"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
        test('{f: Foo}', async () => {
            const replacer = Jsonizer.replacer<{f: Foo}>();
            const foo = { f: new Foo() };
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{"f":"Foo"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });

    });

    describe('with 3rd party class', () => {
        test('Buffer', async () => {
            const replacer = Jsonizer.replacer<Buffer>();
            const buf = Buffer.from('abc');
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{".":"Buffer"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
        test('[Buffer]', async () => {
            const replacer = Jsonizer.replacer<Buffer[]>();
            const buf = [Buffer.from('ceci est un test')];
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{"*":"Buffer"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
        test('{b: Buffer}', async () => {
            const replacer = Jsonizer.replacer<{b: Buffer}>();
            const buf = { b: Buffer.from('ceci est un test') };
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver();
            const jsonReviver = JSON.stringify(reviver);
            expect(jsonReviver).toEqual('{"b":"Buffer"}');
            expect(replacer.toString()).toEqual(jsonReviver);
        });
    });

});

describe('Parse with generated reviver gives the expected type hierarchy', () => {
    describe('with built-in type', () => {
        test('Date', async () => {
            const replacer = Jsonizer.replacer<Date>();
            const now = new Date();
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const date = JSON.parse(json, reviver);
            expect(date).toBeInstanceOf(Date);
            expect(date).toEqual(now);
        });
        test('[Date]', async () => {
            const replacer = Jsonizer.replacer<[Date]>();
            const now = [new Date()];
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const date = JSON.parse(json, reviver);
            expect(date[0]).toBeInstanceOf(Date);
            expect(date).toEqual(now);
        });
        test('{d: Date}', async () => {
            const replacer = Jsonizer.replacer<{d: Date}>();
            const now = { d: new Date() };
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const date = JSON.parse(json, reviver);
            expect(date.d).toBeInstanceOf(Date);
            expect(date).toEqual(now);
        });
    });
    describe('with custom class', () => {
        @Namespace('custom.class')
        @Reviver<Foo>({
            '.': () => new Foo()
        })
        class Foo { }
        test('Foo', async () => {
            const replacer = Jsonizer.replacer<Foo>();
            const foo = new Foo();
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const fooRevived = JSON.parse(json, reviver);
            expect(fooRevived).toBeInstanceOf(Foo);
            expect(fooRevived).toEqual(foo);
        });
        test('[Foo]', async () => {
            const replacer = Jsonizer.replacer<[Foo]>();
            const foo = [new Foo()];
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const fooRevived = JSON.parse(json, reviver);
            expect(fooRevived[0]).toBeInstanceOf(Foo);
            expect(fooRevived).toEqual(foo);
        });
        test('{f: Foo}', async () => {
            const replacer = Jsonizer.replacer<{f: Foo}>();
            const foo = { f: new Foo() };
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const fooRevived = JSON.parse(json, reviver);
            expect(fooRevived.f).toBeInstanceOf(Foo);
            expect(fooRevived).toEqual(foo);
        });
    });

    describe('with 3rd party class', () => {
        test('Buffer', async () => {
            const replacer = Jsonizer.replacer<Buffer>();
            const buf = Buffer.from('ceci est un test');
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver<Buffer>();
            const bufRevived = JSON.parse(json, reviver);
            expect(bufRevived).toBeInstanceOf(Buffer);
            expect([...bufRevived.values()]).toEqual([...buf.values()]);
        });
        test('[Buffer]', async () => {
            const replacer = Jsonizer.replacer<Buffer[]>();
            const buf = [Buffer.from('abc')];
            const jsonInvariant = JSON.stringify(buf, null, 4);
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver();
            const bufRevived = JSON.parse(json, reviver);
            expect(bufRevived[0]).toBeInstanceOf(Buffer);
            expect(bufRevived).toEqual(buf);
        });
        test('{b: Buffer}', async () => {
            const replacer = Jsonizer.replacer<{b: Buffer}>();
            const buf = { b: Buffer.from('ceci est un test') };
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver();
            const bufRevived = JSON.parse(json, reviver);
            expect(bufRevived.b).toBeInstanceOf(Buffer);
            expect(bufRevived).toEqual(buf);
        });
    });

});

describe('Revive after parse gives the expected type hierarchy', () => {
    describe('with built-in type', () => {
        test('Date', async () => {
            const replacer = Jsonizer.replacer<Date>();
            const now = new Date();
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const date = reviver(JSON.parse(json));
            expect(date).toBeInstanceOf(Date);
            expect(date).toEqual(now);
        });
        test('[Date]', async () => {
            const replacer = Jsonizer.replacer<[Date]>();
            const now = [new Date()];
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const date = reviver(JSON.parse(json));
            expect(date[0]).toBeInstanceOf(Date);
            expect(date).toEqual(now);
        });
        test('{d: Date}', async () => {
            const replacer = Jsonizer.replacer<{d: Date}>();
            const now = { d: new Date() };
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const date = reviver(JSON.parse(json));
            expect(date.d).toBeInstanceOf(Date);
            expect(date).toEqual(now);
        });
    });
    describe('with custom class', () => {
        @Namespace('revive.custom.class')
        @Reviver<Foo>({
            '.': () => new Foo()
        })
        class Foo { }
        test('Foo', async () => {
            const replacer = Jsonizer.replacer<Foo>();
            const foo = new Foo();
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const fooRevived = reviver(JSON.parse(json));
            expect(fooRevived).toBeInstanceOf(Foo);
            expect(fooRevived).toEqual(foo);
        });
        test('[Foo]', async () => {
            const replacer = Jsonizer.replacer<[Foo]>();
            const foo = [new Foo()];
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const fooRevived = reviver(JSON.parse(json));
            expect(fooRevived[0]).toBeInstanceOf(Foo);
            expect(fooRevived).toEqual(foo);
        });
        test('{f: Foo}', async () => {
            const replacer = Jsonizer.replacer<{f: Foo}>();
            const foo = { f: new Foo() };
            const json = JSON.stringify(foo, replacer, 4);
            const reviver = replacer.getReviver();
            const fooRevived = reviver(JSON.parse(json));
            expect(fooRevived.f).toBeInstanceOf(Foo);
            expect(fooRevived).toEqual(foo);
        });
    });

    describe('with 3rd party class', () => {
        test('Buffer', async () => {
            const replacer = Jsonizer.replacer<Buffer>();
            const buf = Buffer.from('ceci est un test');
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver<Buffer>();
            const bufRevived = reviver(JSON.parse(json));
            expect(bufRevived).toBeInstanceOf(Buffer);
            expect([...bufRevived.values()]).toEqual([...buf.values()]);
        });
        test('[Buffer]', async () => {
            const replacer = Jsonizer.replacer<Buffer[]>();
            const buf = [Buffer.from('ceci est un test')];
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver();
            const bufRevived = reviver(JSON.parse(json));
            expect(bufRevived[0]).toBeInstanceOf(Buffer);
            expect(bufRevived).toEqual(buf);
        });
        test('{b: Buffer}', async () => {
            const replacer = Jsonizer.replacer<{b: Buffer}>();
            const buf = { b: Buffer.from('ceci est un test') };
            const json = JSON.stringify(buf, replacer, 4);
            const reviver = replacer.getReviver();
            const bufRevived = reviver(JSON.parse(json));
            expect(bufRevived.b).toBeInstanceOf(Buffer);
            expect(bufRevived).toEqual(buf);
        });
    });

});

describe('Parse/stringify with core JSON types', () => {
    const primitives = [
        [null, 'null'], [42, '42'], [true, 'true'], [false, 'false'], ['string', '"string"']
    ] as [any, string][]
    for (const [data, jData] of primitives) {
        describe(`${jData}`, () => {
            test('Invariant', async () => {
                expect(JSON.stringify(data)).toEqual(jData);
                expect(JSON.parse(jData)).toEqual(data);
            });
            test('Stringify', async () => {
                const replacer = Jsonizer.replacer();
                const json = JSON.stringify(data, replacer, 4);
                expect(json).toEqual(jData);
                expect(replacer.getReviver()).toBeNull();
                expect(replacer.toString()).toBeNull();
            });
            test('Parse', async () => {
                const json = JSON.stringify(data);
                const reviver = Reviver.revive({});
                const dataParsed = JSON.parse(json, reviver);
                expect(dataParsed).toEqual(data);
            });
            test('Revive after parse', async () => {
                const json = JSON.stringify(data);
                const reviver = Reviver.revive({});
                const dataParsed = JSON.parse(json);
                const dataRevived  = reviver(dataParsed);
                expect(dataRevived).toEqual(data);
            });
        });
    }
    const types = [
        [[], '[]'], [{}, '{}']
    ] as [any, string][]
    for (const [data, jData] of types) {
        describe(`${jData}`, () => {
            test('Invariant', async () => {
                expect(JSON.stringify(data)).toEqual(jData);
                expect(JSON.parse(jData)).toEqual(data);
            });
            test('Stringify', async () => {
                const replacer = Jsonizer.replacer();
                const json = JSON.stringify(data, replacer, 4);
                expect(json).toEqual(jData);
                expect(replacer.getReviver()).toBeNull();
                expect(replacer.toString()).toBeNull();
            });
            test('Parse', async () => {
                const json = JSON.stringify(data);
                const reviver = Reviver.revive({});
                const dataParsed = JSON.parse(json, reviver);
                expect(dataParsed).toEqual(data);
            });
            test('Revive after parse', async () => {
                const json = JSON.stringify(data);
                const reviver = Reviver.revive({});
                const dataParsed = JSON.parse(json);
                const dataRevived  = reviver(dataParsed);
                expect(dataRevived).toEqual(data);
            });
        });
    }
    describe(`undefined`, () => {
        const data = undefined;
        const jData = undefined;
        test('Invariant', async () => {
            expect(JSON.stringify(data)).toEqual(jData);
        });
        test('Stringify', async () => {
            const replacer = Jsonizer.replacer();
            const json = JSON.stringify(data, replacer, 4);
            expect(json).toEqual(jData);
            expect(replacer.getReviver()).toBeNull();
            expect(replacer.toString()).toBeNull();
        });
    });

    describe('Nested structure', () => {
        let room = {
            number: 23
        };
        let meetup = {
            title: "Conference",
            participants: [
                { name: "John", birth: new Date() },
                { name: "Alice", birth: new Date() }
            ],
            place: room // meetup references room
        };
        const expectedReviver = '{"participants":{"*":{"birth":"Date"}}}'
        test('Stringify', async () => {
            const replacer = Jsonizer.replacer<typeof meetup>();
            const json = JSON.stringify(meetup, replacer, 4);
            expect(replacer.toString()).toEqual(expectedReviver);
            const reviver = replacer.getReviver();
            const reviverJson = JSON.stringify(reviver);
            expect(reviverJson).toEqual(expectedReviver);
        });
        test('Parse', async () => {
            const json = JSON.stringify(meetup);
            const reviver = Reviver.revive<typeof meetup>(JSON.parse(expectedReviver));
            const meetupParsed = JSON.parse(json, reviver);
            expect(meetupParsed.participants[0].birth).toBeInstanceOf(Date);
            expect(meetupParsed).toEqual(meetup);
        });
        test('Revive after parse', async () => {
            const json = JSON.stringify(meetup);
            const reviver = Reviver.revive<typeof meetup>(JSON.parse(expectedReviver));
            const meetupParsed = JSON.parse<typeof meetup>(json);
            expect(meetupParsed.participants[0].birth.getFullYear).toBeUndefined();
            const meetupRevived  = reviver(meetupParsed);
            expect(meetupRevived.participants[0].birth.getFullYear).toBeInstanceOf(Function);
            expect(meetupRevived).toEqual(meetup);
        });
    });

    describe('Invariants', () => {
        test('API', async () => {
            const rev = Jsonizer.reviver<any>({});
            expect(!! rev.revive).toBeTruthy();
        });
    });

    describe('Clone', () => {
        test('{d: Date}', async () => {
            const replacer = Jsonizer.replacer<{ d: Date }>();
            const now = { d: new Date() };
            const json = JSON.stringify(now, replacer, 4);
            const reviver = replacer.getReviver();
            const clone = JSON.parse(json, reviver);
            expect(clone).not.toBe(now);
            expect(clone.d).not.toBe(now.d);
            expect(clone.d).toBeInstanceOf(Date);
            expect(clone.d.getTime()).toBe(now.d.getTime());
        });
        test('{n: 42}', async () => {
            const replacer = Jsonizer.replacer<{ n: number }>();
            const data = { n: 42 };
            const json = JSON.stringify(data, replacer, 4);
            const reviver = replacer.getReviver();
            const clone = JSON.parse(json, reviver);
            expect(clone).not.toBe(data);
            expect(typeof clone.n).toBe('number');
            expect(clone.n).toBe(data.n);
        });
    });
});

describe('Corner cases', () => {
    test('`null` Reviver', async () => {
        const reviver = Reviver.revive(null);
        expect(JSON.stringify(reviver)).toBe('{}');
    });
    test('Stringify `[undefined, undefined]`', async () => {
        // invariant
        let json = JSON.stringify([undefined, undefined]);
        expect(json).toBe('[null,null]');

        const replacer = Jsonizer.replacer();
        json = JSON.stringify([undefined, undefined], replacer);
        expect(json).toBe('[null,null]');
    });
    test('Nested `[[[Date]]]`', async () => {
        const data = [[[new Date('2022-03-16')]]];
        let json = JSON.stringify(data);
        expect(json).toBe('[[[\"2022-03-16T00:00:00.000Z\"]]]');

        const replacer = Jsonizer.replacer();
        json = JSON.stringify(data, replacer);
        expect(json).toBe('[[[\"2022-03-16T00:00:00.000Z\"]]]');
        expect(replacer.toString()).toEqual('{"*":{"*":{"*":"Date"}}}');
    });
});

describe('@Namespace gives a qualified name to classes', () => {
    test('Chain', () => {
        class Root {}

        @Namespace (Root)
        class Parent {}
        @Namespace (Parent)
        class Child {}
        expect(Namespace.getQualifiedName(Child)).toBe('Root.Parent.Child');
    });

    test('Absolute', () => {
        @Namespace ('org.example')
        class Root {}

        @Namespace (Root)
        class Parent {}
        @Namespace (Parent)
        class Child {}
        expect(Namespace.getQualifiedName(Child)).toBe('org.example.Root.Parent.Child');
    });
})
