# textbase-fs


- Textbase fuse filesystem. Mount https://textbase.scriptorium.ro as a local filesystem.
- Textbase downloader. In order to download the whole of Textbase, run:

```bash
$ npx ts-node src/downloader/downloader.ts
```
or
 
```bash
$ npm run downloader
```

Works on Node v18.

## Build: 
```bash
$ npm install 
$ npm run build
```

## Test
```bash
$ npm i jest -g
$ jest
```

## Run:

```bash
$ npm run index
```