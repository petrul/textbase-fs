import { CacheManager } from "../src/cache";
import { NodeFactory } from "../src/node-factory";
import { AuthorNode, DivNode, MOD_DIR, OpusNode, RootNode } from "../src/nodes";
import { TextbaseClient } from "../src/textbase-client";

describe('nodes', () => {

    const tbc = new TextbaseClient();
    const cacheman = new CacheManager(tbc);
    const startupDate = new Date();
    const nf  = new NodeFactory(tbc, startupDate, cacheman);

    it('/', async () => {

        await cacheman.init();

        let root = nf.getNode('/') as RootNode;
        expect(root).toBeInstanceOf(RootNode);
        expect(root).toBeTruthy();
        expect(await root.exists()).toBe(true);
        expect(await root.type()).toEqual('dir');
        const attr = await root.attr();
        expect(attr.size).toEqual(4096); // because usually empty dirs in linux are 4096-sized

        const listing = await root.readdir();
        expect(listing).toBeTruthy();
        expect(listing.length).toBeGreaterThan(0);
        listing.forEach(it => expect(typeof it).toEqual('string'));
        listing.forEach(it => expect(it.indexOf(' ')).toBeLessThan(0));

    })

    // non-existing 'author'
    // .Thrash should not exist
    it('/.Trash', async () => {
        const node = nf.getNode('/.Trash') as AuthorNode;
        expect(node).toBeInstanceOf(AuthorNode);
        expect(await node.exists()).toBe(false);

        const attr = await node.attr();
        const _type = await node.type(); 
        
        expect(attr).toBeUndefined();
        expect(_type).toBeUndefined();

    })

    it('/alecsandri', async () => {
        const node = nf.getNode('/alecsandri') as AuthorNode;
        expect(node).toBeInstanceOf(AuthorNode);
        expect(await node.exists()).toBe(true);

        const attr = await node.attr();
        const nodeType = await node.type();
        
        expect(attr).toBeDefined();
        expect(attr.atime).toEqual(startupDate);
        expect(attr.ctime).toEqual(startupDate);
        expect(attr.mtime).toEqual(startupDate);
        expect(nodeType).toBe('dir');

        const listing = await node.readdir();
        expect(listing).toBeDefined()
        expect(listing.length).toBeGreaterThan(0)
        listing.forEach(it => {
            expect(it.length).toBeGreaterThan(0);
        })

        
    })

    it('/alecsandri/__no_exists', async () => {
        // non-existent opus 
        const node = nf.getNode('/alecsandri/__no_exists') as OpusNode;
        expect(node).toBeInstanceOf(OpusNode);
        expect(await node.exists()).toBe(false);
        expect(await node.exists()).toBe(false); // twice
    })

    it('/alecsandri/iorgu_de_la_sadagura', async () => {
        const node = nf.getNode('/alecsandri/iorgu_de_la_sadagura') as OpusNode;
        expect(node).toBeInstanceOf(OpusNode);
        expect(await node.exists()).toBe(true);

        const attr = await node.attr();
        const nodeType = await node.type();
        
        expect(attr).toBeDefined();
        expect(attr.atime).toEqual(startupDate);
        expect(attr.ctime).toEqual(startupDate);
        expect(attr.mtime).toEqual(startupDate);
        expect(attr.mode).toEqual(MOD_DIR);
        expect(nodeType).toBe('dir'); //

        const listing = await node.readdir();
        // console.log(listing);
        
        expect(listing).toBeDefined()
        expect(listing.length).toBeGreaterThan(0)
        listing.forEach(it => {
            expect(it.length).toBeGreaterThan(0)
        });

        // console.log(listing);
    })

    // tei div tests

    it('/alecsandri/iorgu_de_la_sadagura/__no_exists', async () => {
        await cacheman.init();

        // non-existent div
        const node = nf.getNode('/alecsandri/iorgu_de_la_sadagura/__no_exists') as DivNode;
        expect(node).toBeInstanceOf(DivNode);
        expect(await node.exists()).toBe(false);
        expect(await node.exists()).toBe(false); // twice
    })

    it('/alecsandri/iorgu_de_la_sadagura/actul_i', async () => {
        await cacheman.init();

        // non-existent div
        const node = nf.getNode('/alecsandri/iorgu_de_la_sadagura/actul_i') as DivNode;
        expect(node).toBeInstanceOf(DivNode);
        expect(await node.exists()).toBe(true);
        expect(await node.exists()).toBe(true); // twice

        expect (await node.type()).toBe('dir');
        const attr = await node.attr();
        // console.log(attr);
        expect(attr).toBeDefined()
        expect(attr.mode).toBe(MOD_DIR);
        const listing = await node.readdir()
        expect(listing).toBeTruthy()
        expect(listing.length).toBeGreaterThan(0)
        // console.log(listing) //
        
    })

    it('/alecsandri/iorgu_de_la_sadagura/actul_i/scena_i', async () => {
        await cacheman.init();

        const node = nf.getNode('/alecsandri/iorgu_de_la_sadagura/actul_i/scena_i') as DivNode;
        expect(node).toBeInstanceOf(DivNode);
        expect(await node.exists()).toBe(true);
        expect(await node.exists()).toBe(true); // twice

        const ntype = await node.type();
        expect(ntype).toBe('file')
        const content = await node.read();
        expect(content).toBeDefined()
        expect(content.length).toBeGreaterThan(10);
        expect(content.indexOf('Să dai degrabă curcanii la bucătărie')).toBeGreaterThan(0)
        // console.log(content);
    })

})