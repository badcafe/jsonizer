import { Jsonizer } from "../src";

/**
 * Adjacent EMPTY containers in an array have no mapper (nothing to
 * revive) : the range optimizer must not try to merge them.
 *
 * Regression : `optimizeRanges()` compared the mappers of adjacent
 * entries with `deepEquals(undefined, undefined)` (both empty entries
 * are unmapped), took the merge branch and read `UNMAPPED_KEYS` of
 * `undefined`. Found in the wild with an HTTP response
 * `[sections, annotations, ...]` where BOTH arrays were empty.
 */
describe('Stringify arrays holding adjacent empty containers', () => {
    test.each([
        [[[], []]],
        [[{}, {}]],
        [[[], {}]],
        [[[], [], true, null]],
        [[{ d: new Date() }, [], []]],
        [[[], [], { d: new Date() }]],
    ])('%j', (value: any) => {
        const replacer = Jsonizer.replacer();
        expect(() => JSON.stringify(value, replacer)).not.toThrow();
    });

    test('the mappers of the mapped siblings survive', () => {
        const replacer = Jsonizer.replacer();
        const json = JSON.stringify([[], [], { d: new Date() }], replacer);
        const revived = JSON.parse(json, replacer.getReviver());
        expect(revived[0]).toEqual([]);
        expect(revived[1]).toEqual([]);
        expect(revived[2].d).toBeInstanceOf(Date);
    });
});
