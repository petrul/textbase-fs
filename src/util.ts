export class Util {

    /**
     * @returns the parent of the path param.
     */
    static parent(path: string) {
        const fragments = path.split('/').filter(it => it);
        const joined = fragments.splice(0, fragments.length - 1).join('/');
        return `/${joined}`;
    }

    /**
     * @returns  the last fragment of the path param.
     */
    static lastFragment(path: string): any {
        const fragments = path.split('/').filter(it => it);
        return fragments[fragments.length - 1];
    }
    
}
