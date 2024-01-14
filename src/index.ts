import { Mounter } from './mounter'
import { TextbaseClient } from './textbase-client';
import { NodeFactory } from './node-factory';
import { CacheManager } from './cache';

const tbclient = new TextbaseClient();
const cacheman = new CacheManager(tbclient);
const startupDate = new Date();
const dispatcher  = new NodeFactory(tbclient, startupDate, cacheman);
const mounter = new Mounter(dispatcher, tbclient, cacheman, startupDate)

mounter.init().then(_ => {
    mounter.mount()
});

