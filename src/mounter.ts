import { CacheManager } from "./cache";
import { NodeFactory } from "./node-factory";
import { DirNode, FileNode, RootNode } from "./nodes";
import { TextbaseClient } from "./textbase-client";

export class Mounter {

  constructor(private nodeFactory: NodeFactory, protected tbc: TextbaseClient, protected cacheman: CacheManager, protected startupDate: Date) {}

  async init() {
    await this.cacheman.init();
    const root = new RootNode(this.tbc, this.cacheman, this.startupDate);
    return await root.readdir(); // so authors be pre-populated in cache
  }

  async mount() {

    // const tbClient = this.tbClient;
    const nodeFact = this.nodeFactory;

    const fuse = require('node-fuse-bindings');
    const mountPath = process.platform !== 'win32' ? './mnt' : 'M:\\'
    // const startupTime = new Date();
    
    fuse.mount(mountPath, {

      readdir: async function (path: string, callback: any) {
        console.log('readdir(%s)', path)

        const node = nodeFact.getNode(path);

        if (await node.exists()) {
          if (await node.type() == "file") {
            throw new Error(`readdir: this should not be a file [${path}]`);
          }

          const dirNode = node as DirNode;
          const listing = await dirNode.readdir();
          // console.log('result', listing);
          return callback(0, listing);

        } else {
          callback(0);
          // throw new Error(`readdir: don't what kind of path this is [${path}]`);
        }
      },

      getattr: async function (path: string, callback: any) {
        console.log('getattr(%s)', path)

        const node = nodeFact.getNode(path);
        if (!node || ! await node.exists()) {
          callback(fuse.ENOENT);
          return;
        }

        const attr = await node.attr();
        callback(0, attr);
      },
      
      open: function (path: string, flags: any, cb: any) {
        console.log('open(%s, %d)', path, flags)
        cb(0, 42) // 42 is an fd
      },

      read: async function (path: any, fd: any, buf: any, len: any, pos: any, cb: any) {
        console.log('read(%s, %d, %d, %d)', path, fd, len, pos)

        const fnode = nodeFact.getNode(path) as FileNode;
        const content = await fnode.read();

        // var str = 'hello world\n'.slice(pos, pos + len)
        var str = content.slice(pos, pos + len)
        if (!str) return cb(0)
        buf.write(str)
        return cb(str.length)
      }
    }, 
    
    function (err: any) {
      if (err) throw err
      console.log('filesystem mounted on ' + mountPath)
    })

    process.on('SIGINT', function () {
      fuse.unmount(mountPath, function (err: any) {
        if (err) {
          console.log('filesystem at ' + mountPath + ' not unmounted', err);
        } else {
          console.log('filesystem at ' + mountPath + ' unmounted');
        }
      })
    })
  }
}
