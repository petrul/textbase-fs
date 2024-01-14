import { CacheManager, LruCacheAdapter } from "./cache";
import { AuthorNode, DivNode, Node, OpusNode, RootNode } from "./nodes";
import { TextbaseClient } from "./textbase-client";

export class NodeFactory {

    cache: LruCacheAdapter<string, Node> = new LruCacheAdapter();

    constructor(
        private tbclient: TextbaseClient, 
        private startupTime: Date,
        protected cacheman: CacheManager) {
    }

    getNode(path: string): Node | undefined {

        const cached = this.cache.get(path);
        if (cached) return cached;

        if (path === '/')
            return new RootNode(this.tbclient, this.cacheman, this.startupTime);

        const fragments = path.split('/').filter(it => it); // non-empty
        const authorName = fragments[0];

        if (fragments.length == 1) {
            // author
            const resp = new AuthorNode(this.tbclient, authorName, this.startupTime, this.cacheman);
            this.cache.set(path, resp);
            return resp;
        }

        if (fragments.length == 2) {
            // opus
            const opName = fragments[1];
            const resp = new OpusNode(this.tbclient, authorName, opName, this.startupTime, this.cacheman);
            this.cache.set(path, resp);
            return resp;
        }

        if (fragments.length > 2) {
            // tei div
            const opName = fragments[1];
            const endFragments = fragments.slice(2, fragments.length);
            const endStr = endFragments.join('/');
            const resp = new DivNode(this.tbclient, authorName, opName, endStr, 
                this.startupTime, this.cacheman, this);
            this.cache.set(path, resp);
            return resp;
        }

        return undefined;
    }

}

