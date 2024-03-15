import { Class, Jsonizer, Namespace, Reviver } from "../src";
import { Category } from "./userGuide.namespaces.jsonizer.movie";

describe('Operations with Revivers', () => {
    describe('Revive object', () => {
        interface Person {
            name: string
            birthDate: Date
        }
        const person: Person = {
            name: 'Bob',
            birthDate: new Date('1998-10-21')
        }
        const personReviver = Jsonizer.reviver<Person>({
            birthDate: Date
        });
        test('stringify reviver', () => {
            const personReviverJson = JSON.stringify(personReviver);
            expect(personReviverJson).toBe('{"birthDate":"Date"}');
        });
        test('reviver from JSON', () => {
            const personReviverJson = JSON.stringify(personReviver);
            const personReviverFromJson = JSON.parse<Reviver<Reviver<Person>>>(personReviverJson, Reviver.get());
            const personJson = JSON.stringify(person);
            // checks that the reviver works
            const personFromJson = JSON.parse(personJson, personReviverFromJson);
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
        test('reviver from replacer', () => {
            const personReplacer = Jsonizer.replacer();
            const personJson = JSON.stringify(person, personReplacer);
            expect(personReplacer.toString()).toBe('{"birthDate":"Date"}');
            const personReviverAuto = personReplacer.getReviver<Person>();
            expect(JSON.stringify(personReviverAuto)).toBe('{"birthDate":"Date"}');
            // checks that the reviver works
            const personFromJson = JSON.parse(personJson, personReviverAuto);
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
    });

    describe('Revive class', () => {
        @Reviver<Person>({
            '.': ({name, birthDate}) => new Person(name, birthDate),
            birthDate: Date
        })
        class Person {
            constructor(
                public name: string,
                public birthDate: Date
            ) {}
        }
        const person = new Person('Bob', new Date('1998-10-21'));
        test('stringify reviver', () => {
            const personReviverJson = JSON.stringify(Reviver.get(Person));
            expect(personReviverJson).toBe('{".":"Person"}');
        });
        test('reviver from JSON', () => {
            const personReviverJson = JSON.stringify(Reviver.get(Person));
            const personReviverFromJson = JSON.parse<Reviver<Reviver<Person>>>(personReviverJson, Reviver.get());
            const personJson = JSON.stringify(person);
            // checks that the reviver works
            const personFromJson = JSON.parse(personJson, personReviverFromJson);
            expect(personFromJson).toBeInstanceOf(Person);
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
        test('reviver from replacer', () => {
            const personReplacer = Jsonizer.replacer();
            const personJson = JSON.stringify(person, personReplacer);
            expect(personReplacer.toString()).toBe('{".":"Person"}');
            const personReviverAuto = personReplacer.getReviver<Person>();
            expect(JSON.stringify(personReviverAuto)).toBe('{".":"Person"}');
            // checks that the reviver works
            const personFromJson = JSON.parse(personJson, personReviverAuto);
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
    });

    describe('Revive class with namespace', () => {
        @Namespace('org.example.people')
        @Reviver<Person>({
            '.': ({name, birthDate}) => new Person(name, birthDate),
            birthDate: Date
        })
        class Person {
            constructor(
                public name: string,
                public birthDate: Date
            ) {}
        }
        const person = new Person('Bob', new Date('1998-10-21'));
        test('stringify reviver', () => {
            const personReviverJson = JSON.stringify(Reviver.get(Person));
            expect(personReviverJson).toBe('{".":"org.example.people.Person"}');
        });
        test('reviver from JSON', () => {
            const personReviverJson = JSON.stringify(Reviver.get(Person));
            const personReviverFromJson = JSON.parse<Reviver<Reviver<Person>>>(personReviverJson, Reviver.get());
            const personJson = JSON.stringify(person);
            // checks that the reviver works
            const personFromJson = JSON.parse(personJson, personReviverFromJson);
            expect(personFromJson).toBeInstanceOf(Person);
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
        test('reviver from replacer', () => {
            const personReplacer = Jsonizer.replacer();
            const personJson = JSON.stringify(person, personReplacer);
            expect(personReplacer.toString()).toBe('{".":"org.example.people.Person"}');
            const personReviverAuto = personReplacer.getReviver<Person>();
            expect(JSON.stringify(personReviverAuto)).toBe('{".":"org.example.people.Person"}');
            // checks that the reviver works
            const personFromJson = JSON.parse(personJson, personReviverAuto);
            expect(personFromJson.birthDate.getFullYear()).toBe(1998);
            expect(typeof personFromJson.birthDate).toBe('object');
            expect(personFromJson.birthDate).toBeInstanceOf(Date);
        });
    });

    describe('Nested reviver', () => {
        const hobbies = [
            {   hobby: 'programming',
                startDate: new Date('2021-01-01'),
            },
            {   hobby: 'cooking',
                startDate: new Date('2020-12-31'),
            },
        ];
        const hobbiesReviver = Jsonizer.reviver<typeof hobbies>({
            '*': {
                startDate: Date
            }
        });
        test('stringify reviver', () => {
            const hobbiesReplacer = Jsonizer.replacer<typeof hobbies>();
            const hobbiesJson = JSON.stringify(hobbies, hobbiesReplacer);
            expect(JSON.parse(hobbiesReplacer.toString()))
                .toEqual(JSON.parse(JSON.stringify(hobbiesReviver)));
        });
    })

    describe('Revive interface with class', () => {
        interface Agent {
            name: string,
            birthDate: Date
        }
        // mimick @badcafe/ts-plugin
        const Agent: Class<Agent> & ((this: any, key: string, value: any) => Agent) = Reviver<Agent>({
            birthDate: Date
        })(class Agent {}) as any;

        @Reviver<Agents>({
            chief: Agent,
            agents: {
                '*': Agent
            }
        })
        class Agents {
            chief!: Agent
            agents!: Agent[]
        }

        const bob: Agent = {
            name: 'Bob',
            birthDate: new Date('1998-10-21')
        };
        const agents = new Agents();
        agents.chief = bob;
        agents.agents = [bob];
        const jsonAgent = JSON.stringify(bob);
        const jsonAgents = JSON.stringify(agents);
        const jsonAgentsArray = JSON.stringify(agents.agents);
        test('revive interface', () => {
            const agentRevivedFromJson = JSON.parse(jsonAgent, Reviver.get(Agent));
            expect(agentRevivedFromJson).toEqual(bob);
        });
        test('revive {interface[]}', () => {
            const agentsRevivedFromJson = JSON.parse(jsonAgents, Reviver.get(Agents));
            expect(agentsRevivedFromJson).toEqual({chief: bob, agents: [bob]});
        });
        test('revive interface[]', () => {
            const AgentsReviver = Reviver.get<Agents>(Agents);
            const AgentsSubReviver = AgentsReviver['agents'] as Reviver<Agent[]>;
            const agentsArrayRevivedFromJson = JSON.parse(jsonAgentsArray, AgentsSubReviver);
            expect(agentsArrayRevivedFromJson).toEqual([bob]);
        });
        test('revive interface[0]', () => {
            const AgentsReviver = Reviver.get<Agents>(Agents);
            const AgentsSubReviver = AgentsReviver['agents'] as Reviver<Agent[]>;
            const AgentReviver = AgentsSubReviver[0] as Reviver<Agent>;
            const agentItemRevivedFromJson = JSON.parse(jsonAgent, AgentReviver);
            expect(agentItemRevivedFromJson).toEqual(bob);
        });
    });
});

describe('Revivers generation', () => {
    const cases = [
        ['Arrays', {'*': 'Date'}, {
            'single item': [new Date()],
            '2 items': [new Date(), new Date()],
            '3 items': [new Date(), new Date(), new Date()],
            'n items': Array(10).fill(0).map(v => new Date())
        }],
        ['Deep struct in arrays', {'*': {a: {b: {c: 'Date'}}}}, {
            'single item': [{ a:{ b: {c: new Date()}}}],
            '2 items': [{ a:{ b: {c: new Date()}}}, { a:{ b: {c: new Date()}}}],
            '3 items': [{ a:{ b: {c: new Date()}}}, { a:{ b: {c: new Date()}}}, { a:{ b: {c: new Date()}}}],
            'n items': Array(10).fill(0).map(v => ({ a:{ b: {c: new Date()}}}))
        }],
        ['Tuple', {'1': 'Date'}, {
            'single mapping': ['', new Date()]
        }],
        ['Range', {'1-2': 'Date'}, {
            '[1-2]': ['', new Date(), new Date()]
        }],
        ['Range', {'1-3': 'Date'}, {
            '[1-3]': ['', new Date(), new Date(), new Date()]
        }],
        ['Range', {'1-10': 'Date'}, {
            '[1-10]': ['', ...Array(10).fill(0).map(v => new Date())]
        }],
        ['Tuple', {'1': 'Date', 3: 'RegExp', 5: 'Date'}, {
            'Mix': [true, new Date(), 12, /test/, 'Text', new Date()]
        }],
        ['Ranges', {'1-2': 'Date', 3: 'RegExp', '4-6': 'Date'}, {
            'with RegExp inside': ['', new Date(), new Date(), /test/, new Date(), new Date(), new Date()]
        }],
        ['Submapper', {'1-5': { d: 'Date', date: 'Date'}}, {
            'can merge': ['', { d: new Date()}, { date: new Date()}, { d: new Date()}, { d: new Date()}, { d: new Date()}]
        }],
        ['Submapper', {'1': { d: 'Date'}, '3-5': { d: 'Date'}}, {
            'with primitive inside': ['', { d: new Date()}, { d: 'not a date'}, { d: new Date()}, { d: new Date()}, { d: new Date()}]
        }],
        ['Submapper', {'2-4': { d: 'Date'}}, {
            'with primitive before': ['', { d: 'not a date'}, { d: new Date()}, { d: new Date()}, { d: new Date()}]
        }],
        ['Submapper', {'1-3': { d: 'Date'}}, {
            'with primitive after': ['', { d: new Date()}, { d: new Date()}, { d: new Date()}, { d: 'not a date'}]
        }],
    ] as const;
    for (const [description, reviver, tests] of cases) {
        describe(description,  () => {
            for (const [title, value] of Object.entries(tests)) {
                test(title,  () => {
                    const replacer = Jsonizer.replacer();
                    const valueJson = JSON.stringify(value, replacer);
                    const strReviver = replacer.toString();
                    expect(JSON.parse(strReviver)).toEqual(reviver);
                    const getReviver = replacer.getReviver();
                    expect(JSON.stringify(getReviver)).toEqual(strReviver);
                    const valueFromJson = JSON.parse(valueJson, getReviver);
                    expect(valueFromJson).toEqual(value);
                });        
            }
        });
    }
    describe('Merge reviver', () => {
        let persons = [{
            name: 'Bob',
            birthDate: new Date('1998-10-21'),
            hobbies: [
                {   hobby: 'programming',
                    startDate: new Date('2021-01-01'),
                },
                {   hobby: 'cooking',
                    startDate: new Date('2020-12-31'),
                },
            ]
        }, {
            name: 'Alice',
            birthDate: new Date('2002-04-01'),
        }];
        // we don't want :
        // {
        //     "0": {
        //         "birthDate": "Date",
        //         "hobbies": {
        //             "*": {
        //                 "startDate": "Date"
        //             }
        //         }
        //     },
        //     "1": {
        //         "birthDate": "Date"
        //     }
        // }
        const personsReviver = Jsonizer.reviver<typeof persons>({
            '*': {
                birthDate: Date,
                hobbies: {
                    '*': {
                        startDate: Date
                    }
                }
            }
        });
        let reverse = false;
        const [bob, alice] = persons;
        for (const pers of [[bob, alice], [alice, bob]]) {
            test(reverse ? 'Missing mapping before' : 'Missing mapping after', () => {
                const personsReplacer = Jsonizer.replacer<typeof persons>();
                const personsJson = JSON.stringify(pers, personsReplacer);
                expect(JSON.parse(personsReplacer.toString()))
                    .toEqual(JSON.parse(JSON.stringify(personsReviver)));
                const personsFromJson = JSON.parse(personsJson, personsReviver);
                expect(personsFromJson).toEqual(pers);        
            });
            reverse = true;
        }
    })

    describe('Merge reviver', () => {
        const persons = [{
            name: 'Bob',
            birthDate: new Date('1998-10-21'),
            hobbies: [
                {   hobby: 'programming',
                    startDate: new Date('2021-01-01'),
                }
            ]
        }, {
            name: 'Alice',
            birthDate: new Date('2002-04-01'),
            hobbies: [
                {   hobby: 'cooking',
                    endDate: new Date('2020-12-31'),
                }
            ]
        }];
        // we don't want :
        // {
        //     "0": {
        //         "birthDate": "Date",
        //         "hobbies": {
        //             "*": {
        //                 "startDate": "Date"
        //             }
        //         }
        //     },
        //     "1": {
        //         "birthDate": "Date",
        //         "hobbies": {
        //             "*": {
        //                 "endDate": "Date"
        //             }
        //         }
        //     }
        // }
        const personsReviver = Jsonizer.reviver<typeof persons>({
            '*': {
                birthDate: Date,
                hobbies: {
                    '*': {
                        startDate: Date,
                        endDate: Date
                    }
                }
            }
        });
        test('Disjoints mappings', () => {
            const personsReplacer = Jsonizer.replacer<typeof persons>();
            const personsJson = JSON.stringify(persons, personsReplacer);
            expect(JSON.parse(personsReplacer.toString()))
                .toEqual(JSON.parse(JSON.stringify(personsReviver)));
            const personsFromJson = JSON.parse(personsJson, personsReviver);
            expect(personsFromJson).toEqual(persons);
        });
    });
    describe('Subrevivers', () => {
        test('expect submapper of "Foo" to be {".": "Foo"}', () => {
            @Reviver<Person_1>({
                '.': ({name, birthDate}) => new Person_1(name, birthDate),
                birthDate: Date
            })
            class Person_1 {
                constructor(
                    public name: string,
                    public birthDate: Date
                ) {}
            }

            const mapper = JSON.parse('{ "0": "Person_1" }', Reviver.get());
            const sub = mapper[0];
            const json = '{"id":123,"name":"Bob","birthDate":"1998-01-21"}';
            const person = JSON.parse<Person_1>(json, sub);
            expect(person).toBeInstanceOf(Person_1);
            expect(person.birthDate).toBeInstanceOf(Date);
            expect(person.birthDate.getFullYear()).toBe(1998);
        })
        test('submapper gives Jsonizer.Self.Identity', () => {
            @Reviver<Person_2>({
                '.': Jsonizer.Self.Identity,
                birthDate: Date
            })
            abstract class $Person_2 {}
            interface Person_2 {
                name: string,
                birthDate: Date
            }

            const mapper = JSON.parse('{ "0": "$Person_2" }', Reviver.get());
            const sub = mapper[0];
            const json = '{"id":123,"name":"Bob","birthDate":"1998-01-21"}';
            const person = JSON.parse<Person_2>(json, sub);
            expect(person.birthDate).toBeInstanceOf(Date);
            expect(person.birthDate.getFullYear()).toBe(1998);
        })
    });
});

describe('Use cases', ()=> {

    test('.map() to a reviver', () => {
        const date = ['2022-11-05'].map(Reviver.get(Date))[0];
        expect(date).toBeInstanceOf(Date);
    })

    test('a reviver can handle both an array or an object', () => {
        interface People {
            name: string
            categories: Category[]
        }
        interface PeopleDTO {
            name: string
            categories: Category[] | Category
        }
        interface Category {
            label: string,
            date: Date
        }
        const reviver = Jsonizer.reviver<People, PeopleDTO>({
            categories: {
                '.': cat => Array.isArray(cat) ? cat : [cat],
                date: Date,
                '*': {
                    date: Date,
                }
            }
        });
        const revObj = reviver({name: 'Bob', categories: { label: 'employee', date: '2022-01-31' }});
        expect(revObj.categories[0].date).toBeInstanceOf(Date);
        const revArr = reviver({name: 'Bob', categories: [{ label: 'employee', date: '2022-01-31' }]});
        expect(revArr.categories[0].date).toBeInstanceOf(Date);
    });

});
