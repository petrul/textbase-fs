import { TextbaseClient } from '../src/textbase-client'

describe('textbase client', () => {

    const tc = new TextbaseClient();

    it('getAuthors', async () => {
        const authors = await tc.getAuthors();
        expect(authors)
        expect(authors.length).toBeGreaterThan(0);
        expect(authors[0].strId).toBeTruthy();
        expect(authors[0].firstName).toBeTruthy();
        expect(authors[0].lastName).toBeTruthy();
        expect(authors[0].originalNameInTeiFile).toBeTruthy();
    });

    it('getAuthorsNames', async () => {
        const authors = await tc.getAuthorsNames();
        expect(authors.length).toBeGreaterThan(0);
    });

    it('getAuthorsOpera', async () => {
        const opera = await tc.getAuthorsOpera('alecsandri');
        expect(opera.length).toBeGreaterThan(0);
    });

    it('getAuthorsOperaNames', async () => {
        const opera = await tc.getAuthorsOperaFragments('alecsandri');
        expect(opera.length).toBeGreaterThan(0);
    });

    it('getDiv', async () => {
        const opera = await tc.getAuthorsOperaFragments('alecsandri');
        const divsProms = opera.map(async op => {
            const divs = await tc.getDiv(`alecsandri/${op}`);
            return divs;
        });

        const divs = await Promise.all(divsProms);
        // expect
        expect(divs.length).toBeGreaterThan(0);

    });

});
