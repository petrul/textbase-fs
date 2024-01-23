import assert from "assert";
import { TextbaseClient } from "../textbase-client";
import fs from 'node:fs';

export class Downloader {

    dlDir: string;
    constructor(dlDir: string = `~/work/textbase-dl-${new Date().getTime()}`, protected tbc: TextbaseClient) {
        const os = require('os');
        this.dlDir = dlDir.replace('~', os.homedir())
        if (!fs.existsSync(this.dlDir)) {
            fs.mkdirSync(this.dlDir);
        }
    }

    mkdir(path: string) {
        fs.mkdirSync(path);
    }

    readonly maxConcurrent = 5;

    async download() {

        const authors = (await tbc.getAuthors()) //.slice(0, 10);
        console.log(`${authors.length} authors`);
                
        for (const author of authors) {
            const authname = author.strId;
            console.log(authname);

            const authdir = `${this.dlDir}/${authname}`;
            if (!fs.existsSync(authdir)) {
                this.mkdir(authdir);
            }

            const opera = await this.tbc.getAuthorsOpera(authname);
            console.log(`opera: ${opera.length} pieces`)
            for (const op of opera) {
                assert(op.id)
                console.log(op.id);
                const opdir = `${authdir}/${op.urlFragment}`
                if (!fs.existsSync(opdir))
                    this.mkdir(opdir);

                const toc = await this.tbc.getDivToc(op.id)
                // console.log(toc);
                // return toc;
                console.log(`op '${op.head}' has toc with ${toc.length} divs`);
                let i = 0
                for (const chapter of toc) {
                    const istr = new String(i++).padStart(4, "0");
                    const pathSlashReplaces  = chapter.path.replace(/\//g, '__');
                    const chapterFilename = `${istr}_${chapter.id}_${pathSlashReplaces}.txt`;
                    
                    const chapterPath = `${opdir}/${chapterFilename}`;
                    console.log(`\t${chapterPath}`);
                    
                    if (! fs.existsSync(chapterPath)) {
                        try {
                            const txt = await tbc.getDivAsTextPlain(chapter.path);
                            // console.log(txt);
                            fs.writeFileSync(chapterPath, txt);
                        } catch (e) {
                            console.warn(`ignoring error occured during retrieval of ${chapter.path}`, e);
                        }

                    }
                }
                
            };
        }
    }
    // async getDivAsTextPlain(path: string) {
    //     try {
    //         return await this.tbc.getDivAsTextPlain(path);
    //     } ca
    // }
}

const tbc = new TextbaseClient()
const dl = new Downloader("~/work/textbase-dl", tbc);
dl.download().then(_ => {
    console.log('c est fini');
})

