import { Jsonizer, Namespace, Mappers, Reviver } from "../src";

export type Message = Message.Response | Message.Request;

export namespace Message {
    export type Core<Req extends boolean> = {
        class: string,
        prop: string,
        token?: string,
        req: Req
    }

    export type Request<Args = any[]> = [
        Core<true>,
        {
            args?: Args
        }
    ]

    export type Response<Value = any> = [
        Core<false>, {
            value ?: Value,
            err ?: Error
        }
    ]

    export type Data = Message.Request[1] | Message.Response[1];

    export function newMessageReviver(payloadMappers: Mappers<Message.Data>): Reviver<Message> {
        // {args?, err?, value?} to revive
        let reviver: Reviver<Data>;
        const dynamicReviver = Jsonizer.reviver<Message, [Core<any>, Mappers<Data>, Data]>({
            // last step: revive the entire Message = [core, data]
            '.': ([core, _mappers, data]) => [core, data],
            //       0       1       2
            0: {
                '.': core => {
                    reviver = (payloadMappers
                        ? Jsonizer.reviver(payloadMappers)
                        : undefined // may be undefined
                    ) as any;
                    return core;
                }
            },
            1: {
                '.': mappers => { // Mappers<Data>
                    if (mappers !== null) { // might be overriden for error types
                        reviver = Reviver.get()(mappers);
                    } else if (! reviver) {
                        reviver = Reviver.get()(null);
                    }
                }
            },
            2: new Proxy({} as any, {
                get: (obj, prop) => reviver[prop as any], // apply the reviver
                ownKeys: () => Reflect.ownKeys(reviver), 
                getPrototypeOf: () => Reflect.getPrototypeOf(reviver)
            })
        });
        return dynamicReviver;
    }
}

export type Ticket = {
    status: Ticket.Status.PENDING;
} | {
    status: Ticket.Status.FAILED;
    error: string;
} | {
    status: Exclude<Ticket.Status, Ticket.Status.FAILED | Ticket.Status.PENDING>;
    id: string;
};

export namespace Ticket {
 
    export namespace DTH {

        @Namespace('Ticket.Server')
        export class Server {
             attach(id: Annotation.Key, ticket: Ticket) {};

        }
        @Namespace('Ticket.Client')
        export class Client {
            refreshStatus() {};
        }

        // used by cluster master|slave
        @Namespace('Ticket.Master')
        export class Master extends Client {
            createTicket(annotation: Annotation & { type: Annotation.Type.Ticket }) {};
        }
    }

    export enum Status {
        PENDING,
        NEW,
        OPEN,
        CLOSED,
        FAILED,
    }

    export type Topic = 'team-data' | 'keywords' | 'members' | 'latex' | 'softwares' | 'publications';

}

export type Annotation<T = any> = {

    id: Annotation.Key;
    target: string;
    def: string;
    icon: String;
    status: Annotation.Status;
    title: string;
    data: T;
} & ({
    type: Annotation.Type.Ticket;
    content: Annotation.Content<string>[];
    ticket: Ticket;
    topic: Ticket.Topic;
} | {
    type: Annotation.Type.Report;
    content: Annotation.Content<Annotation.Content.RichText>[];
    severity: string;
    isLatex: boolean;
} | {
    type: Annotation.Type.Comment;
    content: Annotation.Content<string>[];
});

export namespace Annotation {

    @Namespace('Annotation')
    export class $ {} // @Reviver defined at the end...

    @Namespace('Annotation')
    export class DTH {

        listForDoc(docLabel: string): Annotation[]
                { throw '' } // dummy code

        updateStatus(id: Annotation.Key, status: Annotation.Status): void {}

    }

    export type Key = [number, string, string];

    export interface Content<T extends Content.RichText> {
        id: string;
        text: T;
        author: object;
        creationDate: Date;
        updateDate?: Date;
    }
    export namespace Content {

        @Namespace('Annotation.Content')
        @Reviver<Content<any>>({
            '.': Jsonizer.Self.Identity,
            creationDate: Date,
            updateDate: Date
        })
        export class $ {}

        @Namespace('Annotation.Content')
        export class DTH {
            append(id: Annotation.Key, text: Annotation.Content<string>): void {}

            update(id: Annotation.Key, text: Annotation.Content<string>): void {}

            delete(id: Annotation.Key, textId: string): void {}
        }

        export type RichText = string | HTMLElement;
    }

    export enum Status {
        NEW, ONGOING, CLOSED,
    }

    export enum Type {
        /** An annotation bound to a ticket */
        Ticket, // Closeable, Checkable
        /** Just a comment */
        Comment, // Closeable
        /** An automatic annotation, such as a validation error */
        Report, // Not closeable
    }

}

// ...here
Reviver<Annotation>({
    '.': Jsonizer.Self.Identity,
    content: {
        '*': Annotation.Content.$
    }
})(Annotation.$);

const data = `[{"req":false,"class":"Annotation.DTH","prop":"listForDoc","token":"b4d08acca79b7-1f07f7d443825b-1b5d80de2eeb07-1c30c1f0d569a1"},null,{"value":[{"id":[2042,"results","ABS-RA-2021"],"def":"LaTeX-LatexComment","data":{"team":"ABS-RA-2021","extent":17,"centers":["SAM"],"partName":"results"},"icon":"comment","type":1,"title":"Comment","status":1,"target":"LateX-annotation-412-1637079386889-undefined","content":[{"id":"0","text":"ceci est un commentaire","author":{"hue":0.7944444444444444,"mail":"jean-paul.doe@acme.fr","initials":"JJ","lastname":"Doe","firstname":"Jean-Paul"},"creationDate":"2021-11-16T16:16:36.913Z"}]},{"id":[2043,"results","ABS-RA-2021"],"def":"LaTeX-LatexTicket","data":{"team":"ABS-RA-2021","extent":17,"centers":["SAM"],"partName":"results"},"icon":"ticket","type":0,"title":"LaTeX issue in results","topic":"latex","status":1,"target":"LateX-annotation-413-1637079407583-undefined","ticket":{"id":"168431","status":3},"content":[{"id":"0","text":"Bonjour,        nous avons relevé une anomalie concernant les données de l'équipe ABS-RA-2021 :TEST TEST        Merci","author":{"hue":0.7944444444444444,"mail":"jean-paul.doe@acme.fr","initials":"JJ","lastname":"Doe","firstname":"Jean-Paul"},"creationDate":"2021-11-16T16:16:59.215Z"}]},{"id":[2044,"description","ABS-RA-2021"],"def":"Keywords-KeywordIssue","data":{"team":"SR0184DR","centers":["SAM"],"team name":"ABS"},"icon":"ticket","type":0,"title":"Issue on team keywords","topic":"team-data","status":1,"target":"Description-keywordsA","ticket":{"id":"168432","status":1},"content":[{"id":"0","text":"Bonjour,            nous avons relevé une anomalie concernant les mots-clés de l'équipe projet Algorithms - Biology - Structure (ABS) :            ...            Merci","author":{"hue":0.008333333333333333,"mail":"philippe.doe@acme.fr","initials":"PP","lastname":"Doe","firstname":"Philippe"},"creationDate":"2021-11-17T07:56:16.032Z"}]},{"id":[2045,"context","ABS-RA-2021"],"def":"LaTeX-LatexComment","data":{"team":"ABS-RA-2021","extent":[{"column":41,"lineNumber":16},{"column":54,"lineNumber":16}],"centers":["SAM"],"partName":"context"},"icon":"comment","type":1,"title":"Comment","status":1,"target":"LateX-annotation-15-1637143862210-undefined","content":[{"id":"0","text":"test","author":{"hue":0.008333333333333333,"mail":"philippe.doe@acme.fr","initials":"PP","lastname":"Doe","firstname":"Philippe"},"creationDate":"2021-11-17T10:11:05.610Z"}]},{"id":[2046,"context","ABS-RA-2021"],"def":"LaTeX-LatexTicket","data":{"team":"ABS-RA-2021","extent":[{"column":55,"lineNumber":16},{"column":65,"lineNumber":16}],"centers":["SAM"],"partName":"context"},"icon":"ticket","type":0,"title":"LaTeX issue in context","topic":"latex","status":1,"target":"LateX-annotation-16-1637143870821-undefined","ticket":{"id":"168433","status":3},"content":[{"id":"0","text":"Bonjour,        nous avons relevé une anomalie concernant les données de l'équipe ABS-RA-2021 :        ...        Merci","author":{"hue":0.008333333333333333,"mail":"philippe.doe@acme.fr","initials":"PP","lastname":"Doe","firstname":"Philippe"},"creationDate":"2021-11-17T10:11:13.699Z"}]},{"id":[2048,"context","ABS-RA-2021"],"def":"LaTeX-LatexComment","data":{"team":"ABS-RA-2021","extent":7,"centers":["SAM"],"partName":"context"},"icon":"comment","type":1,"title":"Comment","status":2,"target":"LateX-annotation-44-1641389065344-undefined","content":[{"id":"0","text":"TEST","author":{"hue":0.6305555555555555,"mail":"Frederic.doe@acme.fr","initials":"FC","lastname":"Doe","firstname":"Frédéric"},"creationDate":"2022-01-05T13:24:31.799Z"}]},{"id":[2049,"context","ABS-RA-2021"],"def":"LaTeX-LatexComment","data":{"team":"ABS-RA-2021","extent":[{"column":29,"lineNumber":9},{"column":36,"lineNumber":9}],"centers":["SAM"],"partName":"context"},"icon":"comment","type":1,"title":"Comment","status":1,"target":"LateX-annotation-45-1641389091794-undefined","content":[{"id":"0","text":"test 2","author":{"hue":0.6305555555555555,"mail":"Frederic.doe@acme.fr","initials":"FC","lastname":"Doe","firstname":"Frédéric"},"creationDate":"2022-01-05T13:24:56.257Z"}]}]}]`;

// Not Asynchronizer in itself, but a real app in the real world that uses it
describe('[Asynchronizer](https://badcafe.github.io/asynchronizer)', () => {
    describe('parsing', () => {

        test('Parse incoming message', () => {
            const reviver: Reviver<Message.Response> = Message.newMessageReviver({
                value: {
                    '*': 'Annotation.$'
                }
            }) as any;
            const annot = JSON.parse(data, reviver);
            expect(annot[1].value[0].content[0].creationDate).toBeInstanceOf(Date);
        });

        test('Parse nested Identity', () => {
            const d = '[{"id":[2042,"results","ABS-RA-2021"],"def":"LaTeX-LatexComment","data":{"team":"ABS-RA-2021","extent":17,"centers":["SAM"],"partName":"results"},"icon":"comment","type":1,"title":"Comment","status":1,"target":"LateX-annotation-412-1637079386889-undefined","content":[{"id":"0","text":"ceci est un commentaire","author":{"hue":0.7944444444444444,"mail":"jean-paul.doe@acme.fr","initials":"JJ","lastname":"Doe","firstname":"Jean-Paul"},"creationDate":"2021-11-16T16:16:36.913Z"}]}]';
            const r = Jsonizer.reviver<Annotation[]>({
                '*': 'Annotation.$'
            });
            const annot = JSON.parse(d, r);
            expect(annot[0].content[0].creationDate).toBeInstanceOf(Date);
        });

    });
});
