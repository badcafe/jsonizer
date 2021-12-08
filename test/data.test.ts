import { Jsonizer } from "../src";

// TEST issue in 2.0.0
describe('Stringify with empty object key', () => {
    test('as the first item', async () => {
        // TEST issue in 2.0.0 :
        //   Illegal Access: This instance of replacer was already used in JSON.stringify(),
        //   please create a new one with Jsonizer.replacer()
        const data = {
            "req": false,
            "class": "UserSession",
            "prop": "getOrCreateUserSession",
            "token": "1bd1842d00a5a5-a092439ef9cb-9a40a25aa23e5-108b81331e3ba9",
            "value": {
                "": {
                    "id": 3594,
                    "createDate": "2021-01-18T07:17:59.764Z",
                    "updateDate": "2021-01-18T07:17:59.764Z"
                },
                "roles": []
            }
        }
        const replacer = Jsonizer.replacer();
        const jsonData = JSON.stringify(data, replacer);
        const jsonReviver = replacer.toString();
        expect(jsonReviver).toEqual('{".":"Date"}');
        expect(replacer.toString()).toEqual(jsonReviver);
    }),
    test('as the last item', async () => {
        // TEST issue in 2.0.0
        //   RangeError: Maximum call stack size exceeded
        const data = {
            "req": false,
            "class": "UserSession",
            "prop": "getOrCreateUserSession",
            "token": "1bd1842d00a5a5-a092439ef9cb-9a40a25aa23e5-108b81331e3ba9",
            "value": {
                "roles": [],
                "": {
                    "id": 3594,
                    "createDate": "2021-01-18T07:17:59.764Z",
                    "updateDate": "2021-01-18T07:17:59.764Z"
                }
            }
        }
        const replacer = Jsonizer.replacer();
        const jsonData = JSON.stringify(data, replacer);
        const jsonReviver = replacer.toString();
        expect(jsonReviver).toEqual('{".":"Date"}');
        expect(replacer.toString()).toEqual(jsonReviver);
    })
});
