import { Jsonizer, Reviver } from "../src";

describe('Replacer', () => {
    @Reviver<User, [string, Date]>({
        '.': ([name, date] ) => new User(name, date),
        1: Date
    })
    class User {
        constructor(
            public name: string,
            public date: Date
        ) {}
        toJSON() {
            return [this.name, this.date];
        }
    }
    const bob = new User('Bob', new Date('2002-12-31'));

    test('Capture without JSON.stringify()', () => {
        const replace = Jsonizer.replacer();
        const res = replace('', bob);
        expect(res[0]).toBe(bob.name);
        expect(res[1]).toBeInstanceOf(Date);
        expect(res[1].getTime()).toBe(bob.date.getTime());
        const map = JSON.stringify(replace.getMappers());
        expect(map).toBe('{".":"User"}');
        const reviver = JSON.parse(map, Reviver.get());
        const clone = reviver(res);
        expect(clone).toBeInstanceOf(User);
        expect(clone.name).toBe('Bob');
        expect(clone.date).toBeInstanceOf(Date);
        expect(clone.date.getTime()).toBe(bob.date.getTime());
        console.log(clone);
    });
    test('replacer() recursive', () => {
        const replace = Jsonizer.replacer();
        const res = replace('', { users: [bob] });
console.log(res);
        expect(res.users[0][0]).toBe(bob.name);
        expect(res.users[0][1]).toBeInstanceOf(Date);
        expect(res.users[0][1].getTime()).toBe(bob.date.getTime());
        const map = JSON.stringify(replace.getMappers());
        expect(map).toBe('{"users":{"*":"User"}}');
        const reviver = JSON.parse(map, Reviver.get());
        const clone = reviver(res);
        expect(clone.users[0]).toBeInstanceOf(User);
        expect(clone.users[0].name).toBe('Bob');
        expect(clone.users[0].date).toBeInstanceOf(Date);
        expect(clone.users[0].date.getTime()).toBe(bob.date.getTime());
        console.log(clone);
    });
});
