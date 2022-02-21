import { Reviver } from "../src";

// https://dev.to/ppoulard/how-to-stringify-and-parse-a-graph-25oa
describe('Graphs', () => {
    describe('`JSON.stringify()`', () => {
            test('Invariant', async () => {
            const a: any = {};
            const b = {a}; // same as b={a: a}
            a.b = b;
            // <ref *1> { a: { b: [Circular *1] } }
            expect(() => {
                const json = JSON.stringify(a);
            }).toThrowError(TypeError)
        });

        test('Invariant (realistic)', async () => {
            class Person {
                hobbies: Hobby[] = []
                constructor(
                    public firstName: string,
                    public birthDate: Date
                ) {}
            }
            class Hobby {
                constructor(
                    public name: string,
                    public person: Person
                ) {
                    person.hobbies.push(this);
                }
            }
            const bob = new Person('Bob', new Date('1998-12-20'));
            new Hobby('cooking', bob);
            new Hobby('programming', bob);
            expect(() => {
                const personJson = JSON.stringify(bob);
            }).toThrowError(TypeError)
        });
        test('Customize `.toJSON()`', async () => {
            class Person {
                hobbies: Hobby[] = []
                constructor(
                    public firstName: string,
                    public birthDate: Date
                ) {}
            }
            class Hobby {
                constructor(
                    public name: string,
                    public person: Person
                ) {
                    person.hobbies.push(this);
                }
                toJSON() {
                    return { name: this.name }
                }
            }
            const bob = new Person('Bob', new Date('1998-12-20'));
            new Hobby('cooking', bob);
            new Hobby('programming', bob);
            const personJson = JSON.stringify(bob);
            const expectedResult = {
                firstName: 'Bob',
                birthDate: '1998-12-20T00:00:00.000Z',
                hobbies: [ {name: 'cooking'}, {name: 'programming'} ]
            }
            expect(JSON.parse(personJson)).toEqual(expectedResult);
        });
        test('Auto-discard the unwanted field', async () => {
            class Person {
                hobbies: Hobby[] = []
                constructor(
                    public firstName: string,
                    public birthDate: Date
                ) {}
            }
            const PERSON: unique symbol = Symbol();
            class Hobby {
                [PERSON]: Person
                constructor(
                    public name: string,
                    person: Person
                ) {
                    this[PERSON] = person;
                    person.hobbies.push(this);
                }
            }
            const bob = new Person('Bob', new Date('1998-12-20'));
            new Hobby('cooking', bob);
            new Hobby('programming', bob);
            const personJson = JSON.stringify(bob, null, 4);
            const expectedResult = {
                firstName: 'Bob',
                birthDate: '1998-12-20T00:00:00.000Z',
                hobbies: [ {name: 'cooking'}, {name: 'programming'} ]
            }
            console.log(personJson)
            console.log(JSON.parse(personJson))
            expect(JSON.parse(personJson)).toEqual(expectedResult);
        });
    });

    describe('`JSON.parse()`', () => {
        test('`ReferenceError`', async () => {
            expect(() => {
                class Person {
                    hobbies: Hobby[] = []
                    constructor(
                        public firstName: string,
                        public birthDate: Date
                    ) {}
                }

                @Reviver<Hobby>({
                    '.': ({name, person}) => new Hobby(name, person)
                })
                class Hobby {
                    constructor(
                        public name: string,
                        public person: Person
                    ) {
                        person.hobbies.push(this);
                    }
                    toJSON() {
                        return { name: this.name }
                    }
                }
                Reviver<Person>({
                    '.': ({firstName, birthDate}) => new Person(firstName, birthDate),
                    birthDate: Date,
                    hobbies: {
                        '*': Hobby
                    }
                })(Person)

                const personJson = JSON.stringify({
                    firstName: 'Bob',
                    birthDate: '1998-12-20T00:00:00.000Z',
                    hobbies: [ {name: 'cooking'}, {name: 'programming'} ]
                });

                const person = JSON.parse(personJson, Reviver.get(Person));
            }).toThrowError(TypeError)
        });

        test('👍', async () => {
            class Person {
                hobbies: Hobby[] = []
                constructor(
                    public firstName: string,
                    public birthDate: Date
                ) {}
            }

            @Reviver<Hobby>({
                '.': ({name}) => (person: Person) => new Hobby(name, person)
            })
            class Hobby {
                constructor(
                    public name: string,
                    public person: Person
                ) {
                    person.hobbies.push(this);
                }
                toJSON() {
                    return { name: this.name }
                }
            }
            type PersonDTO = {
                firstName: string,
                birthDate: Date,
                hobbies: {(person: Person): Hobby}[]
            }
            Reviver<Person, PersonDTO>({
                '.': ({firstName, birthDate, hobbies}) => {
                    const person = new Person(firstName, birthDate);
                    hobbies.map(hobby => hobby(person))
                    return person;
                },
                birthDate: Date,
                hobbies: {
                    '*': Hobby
                }
            })(Person)

            const personJson = JSON.stringify({
                firstName: 'Bob',
                birthDate: '1998-12-20T00:00:00.000Z',
                hobbies: [ {name: 'cooking'}, {name: 'programming'} ]
            });

            const person = JSON.parse(personJson, Reviver.get(Person));
            expect(person.birthDate).toBeInstanceOf(Date);
            expect(person.hobbies).toHaveLength(2);
            expect(person.hobbies[0]).toBeInstanceOf(Hobby);
            expect(person.hobbies[1]).toBeInstanceOf(Hobby);
        });
    });
});
