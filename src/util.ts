/**
 * Indicates whether any value is a primitive or not.
 */
export function isPrimitive(value: any): boolean {
    // undefine is also tested because it is a value that can be found in an array
    return value === null || value === undefined || value === true || value === false || typeof value === 'string' || typeof value === 'number';
}

/**
 * Return the keys of an object that are not `undefined`.
 */
export function valuedKeys(obj: object): string[] {
    return Object.entries(obj)
        .filter(([, val]) => val !== undefined)
        .map(([key]) => key)
}

/**
 * Test whether the structure of two objects have the same values.
 * 
 * @param a
 * @param b
 * @param missings A `function(key, a, b)` invoked when a key present
 *      in `a` is missing in `b` that may or may not fix the missing key ;
 *      returns `true` if the missing key
 *      is fixed, `false` otherwise
 */
export function deepEquals(
    a: any,
    b: any,
    missings?: (key: string, a: any, b: any) => boolean
): boolean {
    if (a === b) { // same ref or same primitives
        return true;
    }
    if (typeof a !== 'object' || typeof b !== 'object' || a == null || b == null) {
        return false;
    }
    const keysA = valuedKeys(a); // works with arrays
    const keysB = valuedKeys(b);
    let missingsProcessed = false;
    function processMissings() {
        if (! missingsProcessed) {
            missingsProcessed = true; // don't do it twice
            // process missing keys : let a chance to fix them
            const setA = new Set(keysA);
            const setB = new Set(keysB);
            for (const key of setA) {
                if (setB.has(key)) {
                    setB.delete(key); // consume
                } else {
                    if (missings!(key, a, b)) {
                        keysB.push(key); // fixed in B
                        setB.delete(key); // consume
                    }
                }
            }
            for (const key of setB) { // rest of B not in A
                if (missings!(key, b, a)) {
                    keysA.push(key); // fixed in A
                }
            }
        }
    }
    if (keysA.length !== keysB.length) {
        if (! Array.isArray(a) && missings) {
            processMissings(); // if not yet done
            if (keysA.length !== keysB.length) { // retry
                return false;
            }
        } else {
            return false; // fast fail
        }
    }
    for (const key of keysA) {
        if (! keysB.includes(key)) {
            if (! Array.isArray(a) && missings) {
                processMissings(); // if not yet done
                if (! keysB.includes(key)) { // retry
                    return false;
                }
            } else {
                return false;
            }
        }
        if (! deepEquals(a[key], b[key], missings)) {
            return false;
        }
    }
    return true;
}
