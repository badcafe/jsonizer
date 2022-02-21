import { Jsonizer } from "../src";

// TEST issue in 2.0.0
// (see CHANGELOG # 2.0.1)
describe('Empty object key', () => {
    describe('Stringify with empty key', () => {
        test('as the first item', async () => {
            // TEST issue in 2.0.0 :
            //   Illegal Access: This instance of replacer was already used in JSON.stringify(),
            //   please create a new one with Jsonizer.replacer()
            const data = {
                "req": false,
                "class": "UserSession",
                "": new Date("2021-01-18T07:17:59.764Z"),
                "date": new Date("2021-01-18T07:17:59.764Z"),
                "prop": "getOrCreateUserSession",
                "token": "1bd1842d00a5a5-a092439ef9cb-9a40a25aa23e5-108b81331e3ba9",
                "value": {
                    "": { // 👈
                        "id": 3594,
                        "createDate": new Date("2021-01-18T07:17:59.764Z"),
                        "updateDate": new Date("2021-01-18T07:17:59.764Z")
                    },
                    "roles": []
                }
            }
            const replacer = Jsonizer.replacer();
            const jsonData = JSON.stringify(data, replacer);
            const jsonReviver = replacer.toString();
            expect(jsonReviver).toEqual('{"":"Date","date":"Date","value":{"":{"createDate":"Date","updateDate":"Date"}}}');
            expect(replacer.toString()).toEqual(jsonReviver);
        }),
        test('as the last item', async () => {
            // TEST issue in 2.0.0
            //   RangeError: Maximum call stack size exceeded
            const data = {
                "req": false,
                "class": "UserSession",
                "": new Date("2021-01-18T07:17:59.764Z"),
                "date": new Date("2021-01-18T07:17:59.764Z"),
                "prop": "getOrCreateUserSession",
                "token": "1bd1842d00a5a5-a092439ef9cb-9a40a25aa23e5-108b81331e3ba9",
                "value": {
                    "roles": [],
                    "": { // 👈
                        "id": 3594,
                        "createDate": new Date("2021-01-18T07:17:59.764Z"),
                        "updateDate": new Date("2021-01-18T07:17:59.764Z")
                    }
                }
            }
            const replacer = Jsonizer.replacer();
            const jsonData = JSON.stringify(data, replacer);
            const jsonReviver = replacer.toString();
            expect(jsonReviver).toEqual('{"":"Date","date":"Date","value":{"":{"createDate":"Date","updateDate":"Date"}}}');
            expect(replacer.toString()).toEqual(jsonReviver);
        })
        test('as the single item', async () => {
            const data = {
                "": { // 👈
                    "id": 3594,
                    "createDate": new Date("2021-01-18T07:17:59.764Z"),
                    "updateDate": new Date("2021-01-18T07:17:59.764Z")
                }
            }
            const replacer = Jsonizer.replacer();
            const jsonData = JSON.stringify(data, replacer);
            const jsonReviver = replacer.toString();
            expect(jsonReviver).toEqual('{"":{"createDate":"Date","updateDate":"Date"}}');
            expect(replacer.toString()).toEqual(jsonReviver);
        })
        test('Invariant', async () => {
            // TEST issue in pre-4.0.0
            //   RangeError: Maximum call stack size exceeded
            // due to recycling context.mapping ; see pushContext() that checks parent.mapper !== context.mapper
            const data = {
                "value": {
                    "id": 3594,
                    "createDate": new Date("2021-01-18T07:17:59.764Z"),
                    "updateDate": new Date("2021-01-18T07:17:59.764Z")
                }
            }
            const replacer = Jsonizer.replacer();
            const jsonData = JSON.stringify(data, replacer);
            const jsonReviver = replacer.toString();
            expect(jsonReviver).toEqual('{"value":{"createDate":"Date","updateDate":"Date"}}');
            expect(replacer.toString()).toEqual(jsonReviver);
        })
    });
    describe('Parse with empty key', () => {
        test('as the first item', async () => {
            // Not an issue in 2.0.0
            const data = {
                "req": false,
                "class": "UserSession",
                "": new Date("2021-01-18T07:17:59.764Z"),
                "date": new Date("2021-01-18T07:17:59.764Z"),
                "prop": "getOrCreateUserSession",
                "token": "1bd1842d00a5a5-a092439ef9cb-9a40a25aa23e5-108b81331e3ba9",
                "value": {
                    "": {
                        "id": 3594,
                        "createDate": new Date("2021-01-18T07:17:59.764Z"),
                        "updateDate": new Date("2021-01-18T07:17:59.764Z")
                    },
                    "roles": []
                }
            }
            const jsonData = JSON.stringify(data);
            const jsonReviver = Jsonizer.reviver<typeof data>({
                '': Date,
                date: Date,
                value: {
                    '': {
                        createDate: Date,
                        updateDate: Date
                    }
                }
            });
            const revivedData = JSON.parse(jsonData, jsonReviver);
            expect(revivedData).toEqual(data);
        }),
        test('as the last item', async () => {
            // Not an issue in 2.0.0
            const data = {
                "req": false,
                "class": "UserSession",
                "": new Date("2021-01-18T07:17:59.764Z"),
                "date": new Date("2021-01-18T07:17:59.764Z"),
                "prop": "getOrCreateUserSession",
                "token": "1bd1842d00a5a5-a092439ef9cb-9a40a25aa23e5-108b81331e3ba9",
                "value": {
                    "roles": [],
                    "": {
                        "id": 3594,
                        "createDate": new Date("2021-01-18T07:17:59.764Z"),
                        "updateDate": new Date("2021-01-18T07:17:59.764Z")
                    }
                }
            }
            const jsonData = JSON.stringify(data);
            const jsonReviver = Jsonizer.reviver<typeof data>({
                '': Date,
                date: Date,
                value: {
                    '': {
                        createDate: Date,
                        updateDate: Date
                    }
                }
            });
            const revivedData = JSON.parse(jsonData, jsonReviver);
            expect(revivedData).toEqual(data);
        })
    })
});
