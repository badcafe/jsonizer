import { Jsonizer, Reviver } from "../src";

describe('Destructuring', () => {
    test('Invariants', async () => {
        @Reviver<TheHobby>({
            start: Date
        })
        class TheHobby {
            constructor(
                public start: Date,
                public hobby: string
            ) {}
        }

        type ThePersonDTO = {
            firstName: string
            mainHobby: TheHobby;
        }

        @Reviver<ThePerson, ThePersonDTO>({
            '.': ({firstName, mainHobby}) => ({
                firstName,
                hobbies: [mainHobby],
                toJSON() {
                    return {
                        firstName: this.firstName,
                        mainHobby: this.hobbies[0]
                    }
                }   
            }),
            mainHobby: TheHobby
        })
        class ThePerson { // just a placeholder
            constructor(
                public firstName: string,
                public hobbies: TheHobby[]
            ) {}
        }

        const jsonPerson = JSON.stringify({
            firstName: 'Bob',
            mainHobby: {
                start: new Date('2022-02-14'),
                hobby: 'Cooking'
            }
        })
        const person = JSON.parse(jsonPerson, Reviver.get(ThePerson));
        expect(person.hobbies[0].start.getFullYear()).toBe(2022);
        (person.hobbies[0].start as any).toJSON = function() {
            return this.toISOString().slice(0, 10)
        }
        JSON.stringify(person, (k, v) => {
            const props = [];
            if (typeof v === 'object') {
                for (let p in v) {
                    props.push(p)
                }
            }
            // console.log(`"${k}"`, typeof v, props, v);
            return v
        });

    });

    test('[Jsonizer.toJSON](): string', async () => {
        @Reviver<Message1, string>({
            '.': msg => new Message1(msg.slice('Message: '.length))
        })
        class Message1 {
            constructor(public message: string) {}
            [Jsonizer.toJSON]() {
                return `Message: ${this.message}`;
            }
        }        
        const err = { msg: new Message1('Oops')}
        const replacer = Jsonizer.replacer<typeof err>();
        const json = JSON.stringify(err, replacer, 4);
        const reviver = replacer.getReviver();
        const clone = JSON.parse(json, reviver);
        expect(clone.msg).toBeInstanceOf(Message1)
    });
    test('toJSON(): string', async () => {
        @Reviver<Message2, string>({
            '.': msg => new Message2(msg.slice('Message: '.length))
        })
        class Message2 {
            constructor(public message: string) {}       
            toJSON() {
                return `Message: ${this.message}`;
            }
        }        
        const err = { msg: new Message2('Oops')}
        const replacer = Jsonizer.replacer<typeof err>();
        const json = JSON.stringify(err, replacer, 4);
        const reviver = replacer.getReviver();
        const clone = JSON.parse(json, reviver);
        expect(clone.msg).toBeInstanceOf(Message2)
    });
    test('[Jsonizer.toJSON](): object', async () => {
        type MessageDTO = {
            msg: string,
            code: {
                t: string,
                v: number
            }
        }
        @Reviver<Message3, MessageDTO>({
            '.': ({msg, code: {t, v}}) => new Message3(msg, t, v)
        })
        class Message3 {
            constructor(public message: string, public type: string, public code: number) {}
            [Jsonizer.toJSON]() {
                return {
                    msg: this.message,
                    code: {
                        t: this.type,
                        v: this.code
                    }
                };
            }
        }        
        const err = { MSG: new Message3('Oops', 'Error', 404)}
        const replacer = Jsonizer.replacer<typeof err>();
        const json = JSON.stringify(err, replacer, 4);
        const reviver = replacer.getReviver();
        const clone = JSON.parse(json, reviver);
        expect(clone.MSG).toBeInstanceOf(Message3)
    });
})
