import { Mappers } from "../src";

describe('Advanced Jsonizer types', () => {
    describe('Code', () => {
        test('Must compile', async () => {
            class Person {
                constructor(
                    public name: string,
                    public birthDate: Date,
                    public hobbies: Hobby[]
                ) {}
            }
            class Hobby {
                constructor(
                    public label: string,
                    public from: Date,
                    public to: Date
                ) {}
            }

            const pm: Mappers<Person> = {
                '/\\w+Date/': Date,
                hobbies: {
                    '*': {
                        from: Date,
                        to: {
                            '.': Date
                        }
                    }
                },
                '.': ({name, birthDate, hobbies}) => new Person(name, birthDate, hobbies),
            }

            interface FooSource {
                '*': string
                '.': number
                foo: boolean
                '//': 'are you kidding ?'
            }

            const nonSenseMapper: Mappers<Person, FooSource, '**', 'this', '~'> = {
                // fields
                '*': 'qname1', // this is not Any
                '.': 'qname2', // this is not Self
                foo: 'qname3',
                '//': 'qname4', // this is not the Regexp Delimiters
                // jokers
                '**': 'qname5', // custom Any
                '~\\w+Date~': 'qname6', // Regexp delimited by custom ~
                '~date\\w+~': 'qname6', // Regexp delimited by custom ~
                'this': // custom Self
                    ({'*': name}) => new Person(name, new Date(), []),
                // jokers redefinition is mandatory
                [Mappers.Jokers.$]: ['**', 'this', '~']
            }

            const nonSenseArrayMapper: Mappers<Person[], FooSource[], '**', 'this', '~'> = {
                // items
                [0]: 'qname1',
                [1]: 'qname2',
                // jokers
                '**': 'qname3', // custom Any
                '8~12': 'qname4', // Range delimited by custom ~
                '24~42': 'qname4',
                // jokers redefinition is mandatory
                [Mappers.Jokers.$]: ['**', 'this', '~']
            }
        });
    });
});
