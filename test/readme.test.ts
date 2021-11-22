import { Jsonizer, Reviver, Class, Mappers, Namespace } from "../src";

import { Category as MovieCategory } from './readme.namespaces.jsonizer.movie';
import { Product as Product2 } from './readme.namespaces.jsonizer.product';
import { Person } from './readme.dto';

// see README.md : all examples are here and tested

declare global {
    interface Buffer {
        [Jsonizer.toJSON]?(): any
    }
}

function verifyPerson<Person extends { birthDate?: Date }>(clazz: Class<Person>, personFromJson: Person, year = 1998) {
    expect(personFromJson).toBeInstanceOf(clazz);
    expect(typeof personFromJson.birthDate).toBe('object');
    expect(personFromJson.birthDate).toBeInstanceOf(Date);
    expect(personFromJson.birthDate!.getFullYear()).toBe(year);
}

describe('README.md examples', () => {
    describe('Overview', () => {
        const person = {
            name: 'Bob',
            birthDate: new Date('1998-10-21')
        }
        const personJson = JSON.stringify(person);
        test('Invariants', () => {
            expect(person.birthDate.getFullYear()).toBe(1998);
            // store or send the data
        });
        test('w/o Jsonizer', () => {
            // respawn the person
            const personFromJson = JSON.parse(personJson);
            expect(() => personFromJson.birthDate.getFullYear()).toThrow(TypeError)
            // Uncaught TypeError: personFromJson.birthDate.getYear is not a function
            expect(typeof personFromJson.birthDate).toBe('string');
        });
        test('with Jsonizer', () => {
            // respawn the person
            const personReviver = Jsonizer.reviver<typeof person>({
                birthDate: Date
            });
            const personFromJson = JSON.parse(personJson, personReviver);
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
    });
    describe('Revivers mappings', () => {
        test('Objects', () => {
            interface Person {
                name: string
                birthDate: Date
            }
            const person: Person = {
                name: 'Bob',
                birthDate: new Date('1998-10-21')
            }
            const personJson = JSON.stringify(person);
            const personReviver = Jsonizer.reviver<Person>({ // 👈  revive a Person
                // Typescript will check the fields that you can map
                birthDate: Date
            });
            // the type of personFromJson is inferred and set to Person
            const personFromJson = JSON.parse(personJson, personReviver);
            // its name is left as-is (a string), but its birthDate is a Date instance 👍
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
        test('Arrays', () => {
            const persons = [
                {
                    name: 'Bob',
                    birthDate: new Date('1998-10-21')
                },
                {
                    name: 'Alice',
                    birthDate: new Date('2002-04-01')
                }
            ];
            const personsJson = JSON.stringify(persons);
                const personsReviver = Jsonizer.reviver<typeof persons>({
                '*': { // 👈  a 'joker' entry for matching Any array item
                    birthDate: Date
                }
            });
            const personsFromJson = JSON.parse(personsJson, personsReviver);
            expect(personsFromJson).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(personsFromJson[i].birthDate).toBeInstanceOf(Date);
            }
        });
        test('Nested mapping', () => {
            const person = {
                name: 'Bob',
                birthDate: new Date('1998-10-21'),
                hobbies: [
                    {   hobby: 'programming',
                        startDate: new Date('2021-01-01'),
                    },
                    {   hobby: 'cooking',
                        startDate: new Date('2020-12-31'),
                    }
                ]
            }
            const personJson = JSON.stringify(person);
            const personReviver = Jsonizer.reviver<typeof person>({
                birthDate: Date,
                hobbies: { // begin the mappings for an array
                    '*': { // begin the mappings for a single item
                        startDate: Date
                    }
                }
            });
            const personFromJson = JSON.parse(personJson, personReviver);
            expect(personFromJson.hobbies).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(personFromJson.hobbies[i].startDate).toBeInstanceOf(Date);
            }
        });
        test('Tuples', () => {
            const person = {
                name: 'Bob',
                birthDate: new Date('1998-10-21')
            }
            type Person = typeof person;
            type Employee = [Person, Date]; // 👈  our tuple type
            
            const employee: Employee = [
                {
                    name: 'Bob',
                    birthDate: new Date('1998-10-21')
                }, new Date('2010-06-01')
            ];
            
            const employeeReviver = Jsonizer.reviver<Employee>({
                0: { // 👈  first tuple item
                    birthDate: Date
                },
                1: Date  // 👈  second tuple item
            });

            const employees: Employee[] = [employee];
            const employeesReviver = Jsonizer.reviver<Employee[]>({ // 👈  Employee[] here
                '*': {
                    0: {
                        birthDate: Date
                    },
                    1: Date
                }
            });
            const employeeJson = JSON.stringify(employee);
            const employeeFromJson = JSON.parse(employeeJson, employeeReviver);
            expect(employeeFromJson).toHaveLength(2);
            expect(employeeFromJson[0].birthDate).toBeInstanceOf(Date);
            expect(employeeFromJson[1]).toBeInstanceOf(Date);

            const employeesJson = JSON.stringify(employees);
            const employeesFromJson = JSON.parse(employeesJson, employeesReviver);
            expect(employeesFromJson).toHaveLength(1);
            expect(employeesFromJson[0][0].birthDate).toBeInstanceOf(Date);
            expect(employeesFromJson[0][1]).toBeInstanceOf(Date);
        });
    });
    describe('Classes', () => {
        test('Custom classes', () => {
            @Reviver<Person>({ // 👈  bind the reviver to the class
                '.': ({name, birthDate}) => new Person(name, birthDate), // 👈  instance builder
                birthDate: Date
            })
            class Person {
                constructor( // all fields are passed as arguments to the constructor
                    public name: string,
                    public birthDate: Date
                ) {}
            }
            const person = new Person('Bob', new Date('1998-10-21'));
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
        });
        test('Self apply', () => {
            @Reviver<Person>({
                '.': Jsonizer.Self.apply(Person), // 👈  same instance builder as above
                birthDate: Date
            })
            class Person {
                constructor( // all fields are passed as arguments to the constructor
                    public name: string,
                    public birthDate: Date
                ) {}
            }
            const person = new Person('Bob', new Date('1998-10-21'));
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
        });
        test('Self assign', () => {
            @Reviver<Person>({
                '.': Jsonizer.Self.assign(Person), // 👈 assign each field to the new instance
                birthDate: Date
            })
            class Person {  // no constructor, fields have to be assigned one by one
                name?: string
                birthDate?: Date
        }
            const person = new Person();
            person.name = 'Bob';
            person.birthDate = new Date('1998-10-21');
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
        });
        test('No @ decorator', () => {
            class Person {
                constructor(
                    public name: string,
                    public birthDate: Date
                ) {}
            }
            Reviver<Person>({
                '.': ({name, birthDate}) => new Person(name, birthDate),
                birthDate: Date
            })(Person) // 👈  apply it to the class = same effect as using it as a decorator
            const person = new Person('Bob', new Date('1998-10-21'));
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
        });
        test('Class with nested JSON', () => {
            interface Hobby {
                hobby: string,
                startDate: Date
            }
            @Reviver<Person>({
                '.': Jsonizer.Self.apply(Person),
                birthDate: Date,
                hobbies: { // 👈 this is not different as the first examples
                    '*': {
                        startDate: Date
                    }
                }
            })
            class Person {
                constructor(
                    public name: string,
                    public birthDate: Date,
                    public hobbies?: Hobby[]
                ) {}
            }
            const person = new Person('Bob', new Date('1998-10-21'), [
                {   hobby: 'programming',
                    startDate: new Date('2021-01-01'),
                },
                {   hobby: 'cooking',
                    startDate: new Date('2020-12-31'),
                }
            ]);
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
            expect(personFromJson.hobbies).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(personFromJson.hobbies![i].startDate).toBeInstanceOf(Date);
            }
        });
        test('Class with nested class', () => {
            @Reviver<Hobby>({
                '.': Jsonizer.Self.assign(Hobby),
                startDate: Date
            })
            class Hobby {
                hobby?: string
                startDate?: Date
                static newHobby(hobby: string, startDate: Date) {
                    const h = new Hobby();
                    h.hobby = hobby;
                    h.startDate = startDate;
                    return h;
                }
            }

            @Reviver<Person>({
                '.': Jsonizer.Self.apply(Person),
                birthDate: Date,
                hobbies: {
                    '*': Hobby  // 👈  we can refer a class decorated with @Reviver
                }
            })
            class Person {
                constructor(
                    public name: string,
                    public birthDate: Date,
                    public hobbies?: Hobby[]
                ) {}
            }
            const hobby = Hobby.newHobby('programming', new Date('2021-01-01'));
            const person = new Person('Bob', new Date('1998-10-21'), [
                hobby,
                Hobby.newHobby('cooking', new Date('2020-12-31'))
            ]);
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
            expect(personFromJson.hobbies).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(personFromJson.hobbies![i]).toBeInstanceOf(Hobby);
                expect(personFromJson.hobbies![i].startDate).toBeInstanceOf(Date);
            }
            const hobbyJson = JSON.stringify(hobby);
            const hobbyReviver = Reviver.get(Hobby);
            const hobbyFromJson = JSON.parse(hobbyJson, hobbyReviver);
            expect(hobbyFromJson).toBeInstanceOf(Hobby);
            expect(hobbyFromJson.hobby).toBe('programming');
            expect(hobbyFromJson.startDate).toBeInstanceOf(Date);
        });
        test('Pass through (Identity)', () => {
            interface Hobby {
                hobby?: string,
                startDate?: Date
            }

            @Reviver<Hobby>({
                '.': Jsonizer.Self.Identity, // 👈  won't create an instance of Hobby
                startDate: Date // 👈  but we still have nested augmented data
            })
            class HobbyReviver implements Hobby {  // 👈  we won't have instances of that class
                hobby?: string
                startDate?: Date
            }

            @Reviver<Person>({
                '.': Jsonizer.Self.apply(Person),
                birthDate: Date,
                hobbies: {
                    '*': HobbyReviver // 👈  just stands for a reviver reference
                }
            })
            class Person {
                constructor(
                    public name: string,
                    public birthDate: Date,
                    public hobbies?: Hobby[] // 👈  just a plain javascript object
                ) {}
            }
            const person = new Person('Bob', new Date('1998-10-21'), [
                {   hobby: 'programming',
                    startDate: new Date('2021-01-01'),
                },
                {   hobby: 'cooking',
                    startDate: new Date('2020-12-31'),
                }
            ]);
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person); // 👈  extract the reviver from the class
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
            expect(personFromJson.hobbies).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(personFromJson.hobbies![i]).not.toBeInstanceOf(HobbyReviver);
                expect(personFromJson.hobbies![i].startDate).toBeInstanceOf(Date);
            }
        });
        test('The `.` (self) builder', () => {
            // 💡 you should first examine the data just after
            @Reviver<Person & { hireDate?: Date }>({ // a Person, maybe with a hireDate
                '.': function({name, birthDate, hireDate}) { // 👈 a more complex builder
                    // "this" is an array of the hierarchy (we have 3 levels):
                    // root   = this[0]; // { type, person }[]
                    // parent = this[1]; // { type, person }
                    // self   = this[2]; // { name, birthDate, hireDate? }
                    const selfIndex = this.length -1;
                    const parentIndex = selfIndex -1; // = this.length -2
                    if (this[parentIndex].type === 'employee') {
                        return new Employee(name, birthDate, hireDate!)
                    } else {
                        return new Person(name, birthDate);
                    }
                },
                birthDate: Date,
                hireDate: Date // 👈 don't forget to augment this date
            })
            class Person {
                constructor(
                    public name: string,
                    public birthDate: Date
                ) {}
            }
            class Employee extends Person {
                constructor(
                    name: string,
                    birthDate: Date,
                    public hireDate: Date
                ) {
                    super(name, birthDate);
                }
            }
            type People = {
                type: 'person'
                person: Person
            } | {
                type: 'employee'
                person: Employee
            }
            const people: People[] = [
                {   type: 'person',
                    person: new Person('Bob', new Date('1998-10-21'))
                },
                {   type: 'employee',
                    person: new Employee('Alice', new Date('2002-04-01'), new Date('2010-06-01'))
                }
            ]
            const peopleJson = JSON.stringify(people);
            const peopleReviver = Jsonizer.reviver<People[]>({
                '*': {
                    person: Person
                }
            });
            const peopleFromJson = JSON.parse(peopleJson, peopleReviver);
            expect(peopleFromJson).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(peopleFromJson[i].person).toBeInstanceOf(Person);
                expect(peopleFromJson[i].person.birthDate).toBeInstanceOf(Date);
            }
            expect(peopleFromJson[0].type).toBe('person');
            expect(peopleFromJson[0].person).not.toBeInstanceOf(Employee);
            expect((peopleFromJson[0].person as Employee).hireDate).toBeUndefined();
            expect(peopleFromJson[1].type).toBe('employee');
            expect(peopleFromJson[1].person).toBeInstanceOf(Employee);
            expect((peopleFromJson[1].person as Employee).hireDate).toBeInstanceOf(Date);
            expect((peopleFromJson[1].person as Employee).hireDate.getFullYear()).toBe(2010);
        });
    });
    describe('DTO', () => {
        test('`toJSON()` and DTO', () => {
            type PersonDTO = {
                name: [string, string]
                birthDate: string
            }

            //       Target   Source
            //         👇        👇                the builder is the reverse fctn of toJSON()
            @Reviver<Person, PersonDTO>({ //                   👇
                '.': ({name: [firstName, lastName], birthDate}) =>
                    new Person(firstName, lastName, new Date(birthDate))
            })
            class Person {
                constructor(
                    public firstName: string,
                    public lastName: string,
                    public birthDate: Date
                ) {}
                toJSON(): PersonDTO { // 👈  toJSON() is the reverse function of the builder
                    return {
                        name: [this.firstName, this.lastName],
                        birthDate: this.birthDate.toISOString().slice(0, 10)
                    }
                }
            }
            const person = new Person('Bob', 'Morane', new Date('1998-10-21'));
            const personJson = JSON.stringify(person);
            expect (JSON.parse(personJson)).toEqual({
                name: ['Bob', 'Morane'],
                birthDate: '1998-10-21'
            });
            const personReviver = Reviver.get(Person);
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
            expect(personFromJson.firstName).toBe('Bob');
            expect(personFromJson.lastName).toBe('Morane');
        });
        test('Types ambivalence', () => {
            type PersonDTO = {
                name: [string, string]
                birthDate: Date // 👈  revived in the builder
            }

            //       Target   Source
            //         👇        👇                  a Date instance, because we have a mapper
            @Reviver<Person, PersonDTO>({ //            👇
                '.': ({name: [firstName, lastName], birthDate}) =>
                    new Person(firstName, lastName, birthDate),
                birthDate: Date                  //     👆
            })                                   // ✅ Date instance expected
            class Person {
                constructor(
                    public firstName: string,
                    public lastName: string,
                    public birthDate: Date
                ) {}
                toJSON(): PersonDTO { // 👈  if we force the result to be a PersonDTO...
                    return {
                        name: [this.firstName, this.lastName],
                        birthDate: this.birthDate
                            .toISOString().slice(0, 10) as any as Date
                    }                                   // 👆    ❌ ...we get a type mismatch
                }                                       // consequence of ambivalence
            }                                           // but it's fine to use it too !
            const person = new Person('Bob', 'Morane', new Date('1998-10-21'));
            const personJson = JSON.stringify(person);
            expect (JSON.parse(personJson)).toEqual({
                name: ['Bob', 'Morane'],
                birthDate: '1998-10-21'
            });
            const personReviver = Reviver.get(Person);
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
            expect(personFromJson.firstName).toBe('Bob');
            expect(personFromJson.lastName).toBe('Morane');
        });
        test('Mappers for Sub-DTO', () => {
            interface Hobby {
                hobby: string,
                startDate: Date
            }
            type HobbyDTO = [string, Date];
            const hobbiesMapper: Mappers<HobbyDTO[]> = { // 👈  Source = Target
                '*': {
                    1: Date
                }
            }

            type PersonDTO = {
                name: [string, string]
                birthDate: Date
                hobbies: HobbyDTO[]
            }

            //       Target   Source
            //         👇        👇
            @Reviver<Person, PersonDTO>({
                '.': ({name: [firstName, lastName], birthDate, hobbies}) =>
                    new Person(firstName, lastName, birthDate,
                        // map the HobbyDTO tuple to Hobby object
                        hobbies.map(([hobby, startDate]) => ({ hobby, startDate }))),
                birthDate: Date,
                hobbies: hobbiesMapper
            })
            class Person {
                constructor(
                    public firstName: string,
                    public lastName: string,
                    public birthDate: Date,
                    public hobbies: Hobby[]
                ) {}
                toJSON(): PersonDTO {
                    return {
                        name: [this.firstName, this.lastName],
                        birthDate: this.birthDate
                            .toISOString().slice(0, 10) as any as Date,
                        hobbies: this.hobbies.map(({ hobby, startDate }) =>
                            [hobby, startDate.toISOString().slice(0, 10) as any as Date])
                    }
                }
            }
            const person = new Person('Bob', 'Morane', new Date('1998-10-21'), [
                { hobby: 'programming',
                  startDate: new Date('2021-01-01')},
                { hobby: 'cooking',
                  startDate: new Date('2020-12-31')},
            ]);
            const personJson = JSON.stringify(person);
            expect (JSON.parse(personJson)).toEqual({
                name: ['Bob', 'Morane'],
                birthDate: '1998-10-21',
                hobbies: [
                    ['programming', '2021-01-01'],
                    ['cooking', '2020-12-31']
                ]
            });
            const personReviver = Reviver.get(Person);
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
            expect(personFromJson.firstName).toBe('Bob');
            expect(personFromJson.lastName).toBe('Morane');
            expect(personFromJson.hobbies).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(personFromJson.hobbies![i].startDate).toBeInstanceOf(Date);
            }
            const hobbiesJson = JSON.stringify(JSON.parse<Person>(personJson).hobbies);
            const hobbiesReviver = Jsonizer.reviver<HobbyDTO[]>(hobbiesMapper);
            const hobbiesFromJson = JSON.parse(hobbiesJson, hobbiesReviver);
            expect(hobbiesFromJson).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(hobbiesFromJson[i][0]).toBe(i === 0 ? 'programming' : 'cooking');
                expect(hobbiesFromJson[i][1]).toBeInstanceOf(Date);
            }
        });
        test('Mappers for Sub-DTO (alt)', () => {
            interface Hobby {
                hobby: string,
                startDate: Date
            }
            type HobbyDTO = [string, Date];
            const hobbiesMapper: Mappers<Hobby[], HobbyDTO[]> = { // 👈  Source ≠ Target
                '*': {
                    '.': ([hobby, startDate]) => ({ hobby, startDate }), // 👈  change the shape
                    1: Date
                }
            }

            type PersonDTO = {
                name: [string, string]
                birthDate: Date
                hobbies: HobbyDTO[]
            }

            @Reviver<Person, PersonDTO>({
                '.': ({name: [firstName, lastName], birthDate, hobbies}) =>
                    new Person(firstName, lastName, birthDate,
                        hobbies as any as Hobby[]),  // 👈  change the type accordingly
                birthDate: Date,
                hobbies: hobbiesMapper
            })
            class Person {
                constructor(
                    public firstName: string,
                    public lastName: string,
                    public birthDate: Date,
                    public hobbies: Hobby[]
                ) {}
                toJSON(): PersonDTO {
                    return {
                        name: [this.firstName, this.lastName],
                        birthDate: this.birthDate.toISOString().slice(0, 10) as any as Date,
                        hobbies: this.hobbies.map(({ hobby, startDate }) =>
                            [hobby, startDate.toISOString().slice(0, 10) as any as Date])
                    }
                }
            }
            const person = new Person('Bob', 'Morane', new Date('1998-10-21'), [
                { hobby: 'programming',
                  startDate: new Date('2021-01-01')},
                { hobby: 'cooking',
                  startDate: new Date('2020-12-31')},
            ]);
            const personJson = JSON.stringify(person);
            const personReviver = Reviver.get(Person);
            const personFromJson = JSON.parse(personJson, personReviver);
            verifyPerson(Person, personFromJson);
            expect(personFromJson.firstName).toBe('Bob');
            expect(personFromJson.lastName).toBe('Morane');
            expect(personFromJson.hobbies).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(personFromJson.hobbies![i].startDate).toBeInstanceOf(Date);
            }
            const hobbiesJson = JSON.stringify(JSON.parse<Person>(personJson).hobbies);
            const hobbiesReviver = Jsonizer.reviver<Hobby[], HobbyDTO[]>(hobbiesMapper);
            const hobbiesFromJson = JSON.parse(hobbiesJson, hobbiesReviver);
            expect(hobbiesFromJson).toHaveLength(2);
            for (let i of [0, 1]) {
                expect(hobbiesFromJson[i].hobby).toBe(i === 0 ? 'programming' : 'cooking');
                expect(hobbiesFromJson[i].startDate).toBeInstanceOf(Date);
            }
        });
        test('Reviving third-party classes and built-in classes', () => {
            type BufferDTO = ReturnType<typeof Buffer.prototype.toJSON>
            Reviver<Buffer, BufferDTO>({
                '.': ({data}) => Buffer.from(data)
            })(Buffer); // 👈  apply it to built-in or third-party classes
            const buf = Buffer.from('ceci est un test');
            const bufJson = JSON.stringify(buf);
            expect(JSON.parse(bufJson)).toEqual({
                type: 'Buffer',
                data: [99,101,99,105,32,101,115,116,32,117,110,32,116,101,115,116]
            });
            const bufFromJson = JSON.parse(bufJson, Reviver.get(Buffer));
            expect(bufFromJson).toBeInstanceOf(Buffer);
            expect([...bufFromJson.values()]).toEqual([...buf.values()]);            
        });
        test('`[Jsonizer.toJSON]`', () => {
            try {
                // see declare global {} at the top of the file
                Buffer.prototype[Jsonizer.toJSON] = function() {  // 👈  plug our custom function
                    return [...this.values()]
                }
                Reviver<Buffer, number[]>({
                    '.': values => Buffer.from(values)
                })(Buffer);
                const buf = Buffer.from('ceci est un test');
                const bufJson = JSON.stringify(buf, Jsonizer.REPLACER);
                expect(JSON.parse(bufJson)).toEqual([
                    99,101,99,105,32,101,115,116,32,117,110,32,116,101,115,116
                ]);
                const bufFromJson = JSON.parse(bufJson, Reviver.get(Buffer));
                expect(bufFromJson).toBeInstanceOf(Buffer);
                expect([...bufFromJson.values()]).toEqual([...buf.values()]);
            } finally {
                delete Buffer.prototype[Jsonizer.toJSON];
            }
        });
        test('Fixing a bad structure', () => {
            const person = {
                first_name: 'Bob',       // 👈  inconsistent field name
                numberOfHobbies: '3',    // 👈  should be a number
                birthDate: '21/10/1998', // 👈  formatted Date
            }
            const personJSON = JSON.stringify(person);
            const personFromJson = JSON.parse(personJSON, Person.reviver);
            expect(personFromJson.firstName).toBe('Bob');
            expect((personFromJson as any).first_name).toBeUndefined();
            expect(typeof personFromJson.numberOfHobbies).toBe('number');
            expect(personFromJson.birthDate.getUTCFullYear()).toBe(1998);
            expect(personFromJson.birthDate.getUTCDate()).toBe(21);
            expect(personFromJson.birthDate.getUTCMonth()).toBe(9);
        });
    });
    describe('Ranges and Regexp', () => {
        const startDate = new Date('2021-01-01');
        const lastDate = new Date('2021-06-01');
        interface Hobby$ {
            hobby: string,
            startDate: Date,
            endDate: Date | null,
            lastDate?: Date
        }
        function verifyHobby<Hobby extends Hobby$>(clazz: Class<Hobby>, hobbyFromJson: Hobby) {
            expect(hobbyFromJson).toBeInstanceOf(clazz);
            expect(hobbyFromJson.hobby).toBe('programming');
            expect(hobbyFromJson.startDate).toBeInstanceOf(Date);
            expect(hobbyFromJson.startDate.toISOString()).toBe(startDate.toISOString());
            expect(hobbyFromJson.endDate).toBeNull();
            expect(hobbyFromJson.lastDate).toBeInstanceOf(Date);
            expect(hobbyFromJson.lastDate!.toISOString()).toBe(lastDate.toISOString());
        }
        test('Regexp', () => {
            //       Target Source   RegExp[]
            //         👇     👇        👇
            @Reviver<Hobby, Hobby, ['/\\w+Date/']>({ // 👈  extend allowed entries in the 3rd type parameter
                '.': Jsonizer.Self.apply(Hobby),
                '/\\w+Date/': Date // 👈 matches any field that ends with 'Date'
            })
            class Hobby {
                constructor(
                    public hobby: string,
                    public startDate: Date,
                    public endDate: Date | null,
                    public lastDate?: Date
                ) {}
            }
            const hobby = new Hobby('programming', startDate, null, lastDate);
            const hobbyJson = JSON.stringify(hobby);
            const hobbyFromJson = JSON.parse(hobbyJson, Reviver.get(Hobby));
            verifyHobby(Hobby, hobbyFromJson);
        });
        test('Regexp (alt)', () => {
            @Reviver<Hobby>({
                '.': Jsonizer.Self.apply(Hobby),
                '*': Date, // 👈 matches any field...
                hobby: Jsonizer.Self.Identity // 👈  ...except 'hobby', kept unchanged
            })
            class Hobby {
                constructor(
                    public hobby: string,
                    public startDate: Date,
                    public endDate: Date | null,
                    public lastDate?: Date
                ) {}
            }
            const hobby = new Hobby('programming', startDate, null, lastDate);
            const hobbyJson = JSON.stringify(hobby);
            const hobbyFromJson = JSON.parse(hobbyJson, Reviver.get(Hobby));
            verifyHobby(Hobby, hobbyFromJson);
        });
        test('Range', () => {
            @Reviver<Wheel>({
                '.': Jsonizer.Self.apply(Wheel)
            })
            class Wheel {
                constructor(
                    public inflated = 1
                ) {}
            }

            @Reviver<Engine>({
                '.': Jsonizer.Self.apply(Engine)
            })
            class Engine {
                constructor(
                    public carburant: 'Electric' | 'Gas' | 'Diesel' | 'Hybrid'
                ) {}
            }

            //     👇  the JSON structure is a tuple
            type CarDTO = [Wheel, Wheel, Wheel, Wheel, Engine];

            //     Target Source  range[]
            //       👇     👇       👇
            @Reviver<Car, CarDTO, ['0-3']>({ // 👈  extend allowed entries in the 3rd type parameter
                '.': ([w1, w2, w3, w4, e]) => new Car(e, w1, w2, w3, w4),
                '0-3': Wheel, // 👈 matches the four first items
                4: Engine // 👈  we could use '*' for the rest
            })
            class Car {
                wheels: Wheel[];
                constructor(
                    public engine: Engine,
                    ...wheels: Wheel[]
                ) {
                    if (wheels.length !== 4) {
                        throw new Error(`A car must have 4 wheels ; found ${wheels.length}`);
                    }
                    this.wheels = wheels;
                }
                toJSON() {
                    return [...this.wheels, this.engine]; // 👈  jsonify as an array
                }
            }

            const car = new Car(new Engine('Hybrid'), new Wheel(1), new Wheel(1), new Wheel(0.5), new Wheel(1));
            const carJson = JSON.stringify(car);
            expect(JSON.parse(carJson)).toEqual([{inflated: 1}, {inflated: 1}, {inflated: 0.5}, {inflated: 1}, {carburant: 'Hybrid'}])
            const carFromJson = JSON.parse(carJson, Reviver.get(Car));
            expect(carFromJson).toBeInstanceOf(Car);
            expect(carFromJson.engine).toBeInstanceOf(Engine);
            expect(carFromJson.engine.carburant).toBe('Hybrid');
            expect(carFromJson.wheels).toHaveLength(4);
            let i = 0;
            for (let wheel of carFromJson.wheels) {
                expect(wheel).toBeInstanceOf(Wheel);
                expect(wheel.inflated).toBe(i++ === 2 ? 0.5 : 1);
            }
        });
    });
    describe('Namespaces', () => {

        // test shadowing code (see README.md)
        class Person {} // Person in outer scope
        () => {
            class Person {} // Person in inner scope
        }

        test('Jsonizer namespaces', () => {
             // invariant : import { Category as MovieCategory }
             //             doesn't change the name
            expect(MovieCategory.name).toBe('Category');

            @Namespace('org.example.myLib')
            class Foo {}
            // 👆 qualified name set to 'org.example.myLib.Foo'

            class Product {}
            @Namespace(Product)
            class Category {}
               // 👆 qualified name set to 'Product.Category'

            expect(Namespace.getQualifiedName(Product)).toBe('Product');
            expect(Namespace.getQualifiedName(Foo)).toBe('org.example.myLib.Foo');
            expect(Namespace.getQualifiedName(Category)).toBe('Product.Category');
            expect(Namespace.getQualifiedName(MovieCategory)).toBe('Movie.Category');

            Namespace('org.example.myApp')(Product)
            // qualified name               👆
            // set to 'org.example.myApp.Product' 
            expect(Namespace.getQualifiedName(Product)).toBe('org.example.myApp.Product');
        
            Namespace('com.example.products')(Product2)
            // qualified name                  👆
            // set to 'com.example.products.Product' 
            expect(Namespace.getQualifiedName(Product2)).toBe('com.example.products.Product');

            // By transitivity, the Category is relocated to `org.example.myApp.Product.Category` :
            expect(Namespace.getQualifiedName(Category)).toBe('org.example.myApp.Product.Category');
            // not affected:
            expect(Namespace.getQualifiedName(MovieCategory)).toBe('Movie.Category');
        });
        test('Jsonizer namespaces (Summary)', () => {
            // Usage as a decorator :
            @Namespace('org.example.myApp')
            class Foo {}
                // 👆 qualified name set to 'org.example.myApp.Foo'
            expect(Namespace.getQualifiedName(Foo)).toBe('org.example.myApp.Foo');

            
            // setting a relative namespace :
            @Namespace(Foo)
            class Bar {}
                // 👆 qualified name set to 'org.example.myApp.Foo.Bar'
            expect(Namespace.getQualifiedName(Bar)).toBe('org.example.myApp.Foo.Bar');
            
            class Baz {}
            
            @Namespace(Baz)
            class Qux {}
                // 👆 qualified name set to 'Baz.Qux'
            expect(Namespace.getQualifiedName(Qux)).toBe('Baz.Qux');
            
            // Usage as a function :

            class Quux {}
            // setting a namespace to an existing class :
            Namespace('org.example.myApp')(Quux)
                                         // 👆 qualified name set to
                                         // 'org.example.myApp.Quux'
            expect(Namespace.getQualifiedName(Quux)).toBe('org.example.myApp.Quux');
            
            // relocating a class
            Namespace('org.example.myApp')(Baz)
                                         // 👆 qualified name set to
                                         // 'org.example.myApp.Baz'
            expect(Namespace.getQualifiedName(Baz)).toBe('org.example.myApp.Baz');
            // and incidentally, Qux subordinate qualified name
            //                       set to 'org.example.myApp.Baz.Qux'
            expect(Namespace.getQualifiedName(Qux)).toBe('org.example.myApp.Baz.Qux');
        });

        // test('Typescript namespaces', () => {
        //     see readme.namespace.typescript.*.ts files
        // });
    });

    describe('Reviving parsed data', () => {
        @Reviver<Person>({
            '.': ({name, birthDate}) => new Person(name, birthDate),
            birthDate: Date
        })
        class Person {
            constructor( // all fields are passed as arguments to the constructor
                public name: string,
                public birthDate: Date
            ) {}
        }
        const person = new Person('Bob', new Date('1998-10-21'));
        const personJson = JSON.stringify(person);
        test('Revive after parsing', () => {
            const personReviver = Reviver.get(Person);

            const personFromJsonNotRevived = JSON.parse(personJson); // or HTTP fetch()
            expect(personFromJsonNotRevived).not.toBeInstanceOf(Person);
            let personRevived = personReviver(personFromJsonNotRevived);
            verifyPerson(Person, personRevived);
            // then you have your data structure, but not augmented with the expected types

            // 👍  just launch the reviver on it
            const personFromJson = personReviver(personFromJsonNotRevived);
            expect(personFromJson).toBeInstanceOf(Person);
            personRevived = personReviver(personFromJson);
            verifyPerson(Person, personRevived);
        })
    });

    describe('Reviver generation', () => {
        interface Hobby {
            hobby: string,
            startDate?: Date,
            endDate?: Date
        }
        @Namespace('Replacer@org.example.people')
        @Reviver<Person>({ // 👈  an "all-in-one" reviver
            '.': Jsonizer.Self.apply(Person),
            birthDate: Date,
            hobbies: {
                '*': {
                    startDate: Date,
                    endDate: Date
                }
            }
        })
        class Person {
            constructor(
                public name: string,
                public birthDate: Date,
                public hobbies?: Hobby[]
            ) {}
        }
        describe('Replacer', () => {
            const tests = [
                [   'from class', 
                    new Person('Bob', new Date('1998-10-21')),
                    {'.': 'Replacer@org.example.people.Person' },
                    ((p: any) => expect(p).toBeInstanceOf(Person))
                ],
                [   'from array', 
                    [   new Person('Bob', new Date('1998-10-21'), [
                            {   hobby: 'programming',
                                startDate: new Date('2021-01-01'),
                            },
                            {   hobby: 'cooking',
                                endDate: new Date('2020-12-31'),
                            },
                        ]),
                        new Person('Alice', new Date('2002-04-01'))
                    ],
                    {'*': 'Replacer@org.example.people.Person' },
                    ((arr: any[]) => {
                        for (const p of arr) {
                            expect(p).toBeInstanceOf(Person)
                        }
                    })
                ],
                [   'from nested structure',
                    [   {   name: 'Bob',
                            birthDate: new Date('1998-10-21'),
                            hobbies: [
                                {   hobby: 'programming',
                                    startDate: new Date('2021-01-01'),
                                },
                                {   hobby: 'cooking',
                                    endDate: new Date('2020-12-31'),
                                },
                            ]
                        }, {name: 'Alice',
                            birthDate: new Date('2002-04-01'),
                        }
                    ],
                    {  '*': {
                        birthDate: 'Date',
                        hobbies: {
                            '*': {
                                startDate: 'Date',
                                endDate: 'Date'
                            }
                        }
                    }},
                    ((arr: any) => {
                        for (const p of arr) {
                            expect(p.birthDate).toBeInstanceOf(Date)
                        }
                    })
                ],
            ] as const;
            for (const [title, data, mapper, doTest] of tests) {
                test(title, () => {
                    // const data = getData(); // can be different things
                    // create a context for the capture :
                    const replacer = Jsonizer.replacer();
                    // stringify with our replacer that also capture the mappings
                    const jsonData = JSON.stringify(data, replacer);

                    // every class decorated with `@Reviver` were captured
                    const jsonReviver = replacer.toString()
                    // NOTE: similar result with :
                    // const jsonReviver = JSON.stringify(replacer.getReviver());

                    // sendOrStoreOrWhatever(jsonData, jsonReviver);
                    function parseData(jsonData: string, jsonReviver: string) {
                        // revive the reviver                          👇 get the reviver for revivers
                        const reviver = JSON.parse(jsonReviver, Reviver.get());
                        // revive the data with the reviver
                        return JSON.parse(jsonData, reviver);
                    }
                    const revived = parseData(jsonData, jsonReviver);
                    doTest(revived);
                    expect(JSON.parse(jsonReviver)).toEqual(mapper);
                });
            }
        });
        describe('Subreviver', () => {
            const hobbies = [
                {   hobby: 'programming',
                    startDate: new Date('2021-01-01'),
                },
                {   hobby: 'cooking',
                    startDate: new Date('2020-12-31'),
                },
            ];
            const jsonHobbies = JSON.stringify(hobbies);
            const personReviver = Reviver.get(Person);

            test('Array', () => {
                const hobbiesReviver = personReviver.hobbies as Reviver<Hobby[]>; // 👈  a subreviver
                const hobbiesFromJson = JSON.parse(jsonHobbies, hobbiesReviver); // 👈  as usual
                expect(hobbiesFromJson).toEqual(hobbies);
                for (const hobby of hobbiesFromJson) {
                    expect(hobby.startDate).toBeInstanceOf(Date);
                }
            });

            test('Item', () => {
                const jsonHobby = JSON.stringify(hobbies[0]);
                const hobbyReviver = personReviver.hobbies[0] as Reviver<Hobby>; // 👈  a subreviver that match the '*' entry
                const hobbyFromJson = JSON.parse(jsonHobby, hobbyReviver); // 👈  as usual
                expect(hobbyFromJson).toEqual(hobbies[0]);
                expect(hobbyFromJson.startDate).toBeInstanceOf(Date);
            });
        });
        test('Dynamic reviver', () => {
            const data = [
                new Person('Bob', new Date('1998-10-21'), [
                    {   hobby: 'programming',
                        startDate: new Date('2021-01-01'),
                    },
                    {   hobby: 'cooking',
                        endDate: new Date('2020-12-31'),
                    },
                ]),
                new Person('Alice', new Date('2002-04-01'))
            ];
            // {'*': 'Replacer@org.example.people.Person' }
            // create a context for the capture :
            const replacer = Jsonizer.replacer();
            // stringify with our replacer that also capture the mappings
            const jsonData = JSON.stringify(data, replacer);
            // every class decorated with `@Reviver` were captured
            const jsonReviver = replacer.toString()

            const jsonTuple = `[${jsonReviver},${jsonData}]`; // 👈  a tuple to send as a JSON string

            let reviver: Reviver<Person>; // 👈  will hold the Reviver = jsonTuple[0]
            const dynamicReviver = Jsonizer.reviver<Person[], [Reviver, Person[]]>({ // 👈  tuple signature is [Reviver, Person[]]
                '.': ([_rev_, data]) => data, // 👈  just return the data
                0: {
                    '.': jsonReviver => reviver = Reviver.get()(jsonReviver) // 👈  revive the reviver 
                },
                1: new Proxy({}, { // 👈  delegate to the reviver 
                    get: (obj, prop) => reviver[prop as any],
                    ownKeys: () => Reflect.ownKeys(reviver),
                    getPrototypeOf: () => Reflect.getPrototypeOf(reviver)
                })
            });
            const dataFromJson = JSON.parse(jsonTuple, dynamicReviver); // 👈  you have it
            // as usual, dataFromJson contains augmented typed data
            expect(dataFromJson).toBeInstanceOf(Array);
            for (const person of dataFromJson) {
                verifyPerson(Person, person, person.name === 'Bob' ? 1998 : 2002);
            }
        });
    });

});
