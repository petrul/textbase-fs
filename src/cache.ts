import { AuthorDto, TeiDivDto } from "./dtos";
import { LRUCache } from 'lru-cache'
import { TextbaseClient } from "./textbase-client";

/**
 * there are maybe several caches. 'readdir' and maybe others.
 * manages those caches. 
 */
export class CacheManager {

    authorList: AuthorDto[]  // list of authors, result of http://localhost:8080/api/authors/
    authorAndOpera: LRUCache<string, AuthorDto> = new LRUCache({max: 2000}); // map of strId => authors as resulted at http://localhost:8080/api/authors/alecsandri
    divCache: LRUCache<string, TeiDivDto> = new LRUCache({max: 2000}) // rest, results of http://localhost:8080/api/divs?path=alecsandri/iorgu_de_la_sadagura

    constructor(protected tbc: TextbaseClient) {}

    async init() {
        if (!this.authorList) {
            const names = await this.tbc.getAuthors();
            this.authorList = names;
        }
        return Promise.resolve(this.authorList);
    }

    // caches = new Map<string, Cache<string, any>>();

    // static readonly CACHENAME_READDIR     = 'readdir';  // cache for readdir
    // static readonly CACHENAME_ATTR        = 'attr';     // cache for attr
    // static readonly CACHENAME_TEIDIV      = 'teidiv';

    // protected getCache(cacheName: string): Cache<any,any> {
    //     let cache = this.caches.get(cacheName);
    //     if (!cache) {
    //         // dynamically create if not already existing
    //         cache = this.createCache(cacheName)
    //     }
    //     return cache;
    // }

    // protected createCache(cacheName: string): Cache<string, any> {
    //     const newCache = new LruCacheAdapter();
    //     this.caches.set(cacheName, newCache);
    //     return newCache;
    // }

    // get teiDivCache(): Cache<string, TeiDivDto> {
    //     return this.caches.get(CacheManager.CACHENAME_TEIDIV);
    // }

    // get readdirCache(): Cache<string, string[]> {
    //     return this.getCache(CacheManager.CACHENAME_READDIR);
    // }

    // get attrCache(): Cache<string, any> {
    //     return this.getCache(CacheManager.CACHENAME_ATTR);
    // }

}

export interface Cache<K,V> {
    contains(key: K): boolean;
    get(key: K): V;
    set(key: K, value: V): V;
}

export class LruCacheAdapter<K, V> implements Cache<K, V> {
    cache: LRUCache<K, V> = new LRUCache({
        max: 1000
    });

    contains(key: K): boolean {
        return this.cache.has(key);
    }    
    get(key: K): V {
        return this.cache.get(key);
    }
    set(key: K, value: V): V {
        this.cache.set(key, value);
        return value;
    }

}

