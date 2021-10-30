import { Reviver, Jsonizer } from "../src";

describe('Use case (taken from another tool)', () => {
    describe('https://github.com/emmkimme/json-helpers', () => {

        const busEvent = {
            channel: '/electron-common-ipc/myChannel/myRequest',
            sender: {
                id: 'MyPeer_1234567890',
                name: 'MyPeer_customName',
                date: new Date(),
                process: {
                    type: 'renderer',
                    pid: 2000,
                    rid: 2,
                    wcid: 10,
                    // undefined is not JSON, therefore not supported
                    // testUndefined: undefined
                },
                testArray: [12, "str", 3, null, new Date(), "end"],
                testBuffer: Buffer.from('ceci est un test')
            },
            request: {
                replyChannel: '/electron-common-ipc/myChannel/myRequest/replyChannel',
                testDate: new Date()
            }
        };

        type BufferDTO = ReturnType<typeof Buffer.prototype.toJSON>

        Reviver<Buffer, BufferDTO>({
            '.': ({data}) => Buffer.from(data)
        })(Buffer);

        test('Revive busEvent', async () => {
            const busEventReviver = Jsonizer.reviver<typeof busEvent>({
                sender: {
                    date: Date,
                    testArray: {
                        [4]: Date
                    },
                    testBuffer: Buffer,
                },
                request: {
                    testDate: Date
                }
            })    
            // Date, Buffer, Error are properly restored
            const busEventJson = JSON.stringify(busEvent);
            const busEventFromJson = JSON.parse(busEventJson, busEventReviver);
            expect(busEventFromJson.request.testDate).toBeInstanceOf(Date);
            expect(busEventFromJson.sender.date).toBeInstanceOf(Date);
            expect(busEventFromJson.sender.process).toEqual(busEvent.sender.process);
            expect(busEventFromJson.sender.testBuffer).toBeInstanceOf(Buffer);
            expect(busEventFromJson.sender.testBuffer.values()).toEqual(busEvent.sender.testBuffer.values());
            // [12, "str", 3, null, new Date(), "end"]
            const [num1, str2, num3, nul4, dat5, str5] = busEventFromJson.sender.testArray;
            expect(num1).toBe(12);
            expect(str2).toBe('str');
            expect(num3).toBe(3);
            expect(nul4).toBeNull();
            expect(dat5).toBeInstanceOf(Date);
            expect(str5).toBe('end');
        });
        test('JSON.stringify -> JSON.parse', async () => {
            const busEventReplacer = Jsonizer.replacer();
            // Date, Buffer, Error are properly restored
            const busEventJson = JSON.stringify(busEvent, busEventReplacer);
            const busEventReviver = busEventReplacer.getReviver();
            const busEventFromJson = JSON.parse(busEventJson, busEventReviver);
            expect(busEventFromJson).toEqual(busEvent);
        });

    });
});
