import { Util } from "../src/util";

describe('util', () => {

    it('util parent', () => {
        expect(Util.parent('/a/b/c')).toBe('/a/b');
        expect(Util.parent("a///b/c/")).toBe('/a/b')
    });

})