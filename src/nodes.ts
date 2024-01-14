import assert from "assert";
import { CacheManager } from "./cache";
import { Attr, AuthorDto, TeiDivDto } from "./dtos";
import { TextbaseClient } from "./textbase-client";
import { Util } from "./util";
import { NodeFactory } from "./node-factory";


export const MOD_FILE=0o100644; // decimal 33188,
export const MOD_DIR=0o40755; // octal value => decimal 16877

function genericFileAttr(startupTime: Date, size: number) : Attr { 
    return {
        mtime: startupTime,
        atime: startupTime,
        ctime: startupTime,
        nlink: 1,
        size: size,
        mode: MOD_FILE, 
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
    };
}

export type NodeType = 'dir' | 'file';

export interface Node {
    exists(): Promise<boolean>;
    type(): Promise<NodeType>;
    attr(): Promise<Attr>;
}

export interface DirNode extends Node {
    readdir() : Promise<string[]>;
}

abstract class AbstractNode implements DirNode, FileNode {

    constructor(protected startupTime: Date, protected tbc: TextbaseClient) {}

    protected readonly dirAttr: Attr = {
        mtime: this.startupTime,
        atime: this.startupTime,
        ctime: this.startupTime,
        nlink: 1,
        size: 4096,
        mode: MOD_DIR, 
        uid: process.getuid ? process.getuid() : 0,
        gid: process.getgid ? process.getgid() : 0
    };

    abstract readdir(): Promise<string[]>;
    abstract exists(): Promise<boolean>;
    abstract type(): Promise<NodeType> ;
    abstract attr(): Promise<Attr> ;

    abstract get completePath(): string;

    _cacheRead: string = undefined;
    async read(): Promise<string> {
        if (!this._cacheRead) {
            // const resp = await this.tbc.getDivAsDecoratedHtml(this.completePath);
            const resp = await this.tbc.getDivAsTextPlain(this.completePath);
            this._cacheRead = resp;
        }
        return Promise.resolve(this._cacheRead);
    }


}

export interface FileNode extends Node {
    read(): Promise<string>;
}

export class RootNode extends AbstractNode {
    constructor(
        protected tbclient: TextbaseClient, 
        protected cacheman: CacheManager,
        protected startupTime: Date) {
            super(startupTime, tbclient);
        }

    async attr() : Promise<Attr> {
        // root dir attrs
        return Promise.resolve(this.dirAttr);
    }
    
    async type(): Promise<NodeType> {
        return Promise.resolve('dir');
    }

    async exists(): Promise<boolean> {
        return Promise.resolve(true);
    }

    async readdir(): Promise<string[]> {

        if (this.cacheman.authorList) {
            const authors = this.cacheman.authorList;
            return TextbaseClient.getAuthorsNamesFromDtos(authors);
        }

        const authors = await this.tbclient.getAuthors();
        this.cacheman.authorList = authors;
        const authorNames = TextbaseClient.getAuthorsNamesFromDtos(authors);

        return authorNames;
    }

    get completePath(): string {
        return '/';
    }

}

/**
 * corresponds the a /author node
 */
export class AuthorNode extends AbstractNode
{
    constructor(
        private tbclient: TextbaseClient,
        private authorName: string,
        protected startupTime: Date,
        protected cacheman: CacheManager) {
            super(startupTime, tbclient);
        }

    _existsCache: boolean = undefined;

    async exists(): Promise<boolean> {
        if (this._existsCache)
            return this._existsCache;

        const authors = this.cacheman.authorList;
        assert (authors);
        const author = authors.find(it => it.strId == this.authorName)
        // const _attr = await this.attr();
        this._existsCache = !! author
        return Promise.resolve(this._existsCache);
    }

    async attr() : Promise<Attr> {
        if (! await this.exists())
            return Promise.resolve(undefined);

        return Promise.resolve(this.dirAttr);
    }

    async type(): Promise<NodeType> {
        if (!await this.exists())
            return Promise.resolve(undefined);
        // else
        return 'dir';
    }

    async readdir(): Promise<string[]> {
        const operaCache = this.cacheman.authorAndOpera;
        if (!operaCache.has(this.authorName)) {
            const resp = await this.tbclient.getAuthor(this.authorName);
            operaCache.set(this.authorName, resp);
            // fragms = TextbaseClient.getTeiDivFragmentsFromDtos(resp);
        }
        const cached = operaCache.get(this.authorName);
        const operaIds = cached.opera?.map(it => it.urlFragment);
        return Promise.resolve(operaIds);
        
    }

    get completePath(): string {
        return `/${this.authorName}`;
    }
}

/**
 * this is for the 2-fragm urls, i.e /author/opus
 * the thing is it is 
 */
export class OpusNode extends AbstractNode implements FileNode {

    constructor(protected tbc: TextbaseClient,  
        protected authorName: string, 
        protected opusName: string,
        protected startupDate: Date,
        protected cacheman: CacheManager,
        ) {
            super(startupDate, tbc);
        }

    async readdir(): Promise<string[]> {
        const path = `/${this.authorName}/${this.opusName}`
        const divCache = this.cacheman.divCache;
        let cached = divCache.get(path);

        if (!cached) {
            const teiDiv = await this.tbc.getDiv(path);
            divCache.set(path, teiDiv);
            cached = teiDiv;
        }

        const listing = cached.children.map(it => it.urlFragment);
        return Promise.resolve(listing); 
    }

    _existsCache: boolean = undefined;
    async exists(): Promise<boolean> {
        if (this._existsCache)
            return this._existsCache;

        this._existsCache = !! await this.getOrRetrieveOpus();
        return Promise.resolve(this._existsCache);
    }
    
    async type(): Promise<NodeType> {
        // const author = await this.getOrRetrieveAuthor();
        const op = await this.getOrRetrieveOpus();
        if (op && op.leaf)
            return 'file';
        else 
            return 'dir';
    }
    
    async attr(): Promise<Attr> {
        if (! this.exists())
            return Promise.resolve(undefined);

        if (await this.type() == 'dir')
            return Promise.resolve(this.dirAttr);
        else 
            return Promise.resolve(genericFileAttr(this.startupDate, 5));
    }

    async getOrRetrieveOpus() {
        const author = await this.getOrRetrieveAuthor();
        assert (author);
        const opera = author.opera;

        const opus = opera.find(it => it.urlFragment == this.opusName);
        return opus;
    }

    async getOrRetrieveAuthor() {
        let author = this.cacheman.authorAndOpera.get(this.authorName);
        if (author) return author;

        return await this.retrieveAuthor();
    }

    async retrieveAuthor(): Promise<AuthorDto> {
        const author = await this.tbc.getAuthor(this.authorName);
        this.cacheman.authorAndOpera.set(this.authorName, author);
        return author;
    }

    get completePath(): string {
        return `/${this.authorName}/${this.opusName}`;
    }

}


export class DivNode extends AbstractNode implements FileNode {

    completePath: string;
    lastFragment: string;

    /**
     * @param path not including author, 
     */
    constructor(
        protected tbclient: TextbaseClient,
        protected authorName: string,
        protected opName: string,
        protected endPath: string, // end path, not including author/opus
        protected startupTime: Date,
        protected cacheman: CacheManager,
        protected nodeFactory: NodeFactory) 
    {
        super(startupTime, tbclient);
        this.completePath = [authorName, opName, endPath].join('/');
        this.lastFragment = Util.lastFragment(endPath);
    }
    
    _exists_cache: boolean = undefined;
    async exists(): Promise<boolean> {
        if (this._exists_cache != undefined) {
            return this._exists_cache;
        }

        const parentPath = Util.parent(this.completePath);
        const parentNode = this.nodeFactory.getNode(parentPath) as DirNode;

        const listing = await parentNode.readdir();
        this._exists_cache = !! listing.find(it => it == this.lastFragment);
        return this._exists_cache;
    }

    async type(): Promise<NodeType> {
        const div  = await this.retrieveDiv();
        return div.leaf ? 'file' : 'dir';
    }

    // dir ops 
    async readdir(): Promise<string[]> {
        const div = await this.retrieveDiv();
        const listing = div.children.map(it => it.urlFragment);
        return Promise.resolve(listing);
    }

    async attr(): Promise<Attr> {
        const div = await this.retrieveDiv();
        const ntype = await this.type();

        if (ntype == 'dir') {
            return this.dirAttr;
        } else 
            return genericFileAttr(this.startupTime, div.size);
        
    }

    async retrieveDiv() : Promise<TeiDivDto> {
        const path = `/${this.authorName}/${this.opName}/${this.endPath}`;
        const cache = this.cacheman.divCache;
        if (cache.has(path))
            return cache.get(path);

        let cached = cache.get(path);
        if (!cached) {
            cached = await this.tbclient.getDiv(path)
            cache.set(path, cached);
        }

        return Promise.resolve(cached);
        
    }

}
