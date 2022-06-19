# @slide-computer/assets

> Manage assets on an Internet Computer assets canister

[![NPM](https://img.shields.io/npm/v/@slide-computer/assets.svg)](https://www.npmjs.com/package/@slide-computer/assets)

## Install

```bash
npm install @slide-computer/assets
```

## Usage

AssetManager supports the (chunked) upload of `File`, `Blob`, `ArrayBuffer`, `Uint8Array` and `number[]`.

```ts
// Create asset manager instance
import { AssetManager } from '@slide-computer/assets';

const canisterId = ...; // Canister id of the asset canister
const agent = ...; // Agent with an authorized identity
const assetManager = new AssetManager({
    canisterId,
    agent,
    concurrency: 32, // Optional (default: 32), max concurrent requests.
    maxSingleFileSize: 450000, // Optional bytes (default: 450000), larger files will be uploaded as chunks.
    maxChunkSize: 1900000, // Optional bytes (default: 1900000), size of chunks when file is uploaded as chunks.
});
```

```ts
// Select file and upload to asset canister in browser
const input = document.createElement('input');
input.type = 'file';
input.addEventListener('change', async () => {
    const file = e.target.files[0];
    const key = await assetManager.insert(file); // example.csv
});
input.click();
```

```ts
// Read file from disk and upload to asset canister in Node
// Content type is required for text files, will fallback to 'application/octet-stream' otherwise
import fs from 'fs';

const file = fs.readFileSync('./example.csv');
const key = await assetManager.insert(file, {fileName: 'example.png', contentType: 'text/csv'});
```

```ts
// Delete file from asset canister
const key = '/path/to/example.jpg'
await assetManager.delete(key);
```

```ts
// Upload multiple files and delete an old file
import fs from 'fs';

const banana = fs.readFileSync('./banana.png');
const apple = fs.readFileSync('./apple.png');
const strawberry = fs.readFileSync('./strawberry.png');
const batch = assetManager.batch();
const keys = [
    await batch.insert(banana, {fileName: 'banana.png'}),
    await batch.insert(apple, {fileName: 'apple.png', path: '/directory/with/apples'}),
    await batch.insert(strawberry, {fileName: 'strawberry.png'}),
];
await batch.delete('/path/to/old/file.csv');
await batch.commit();
```

```ts
// Read file from disk, compress with gzip and upload to asset canister in Node
// Recommended for HTML and JS files
import fs from 'fs';
import pako from 'pako';

const file = fs.readFileSync('./index.html');
const gzippedFile = pako.gzip(file);
const key = await assetManager.insert(gzippedFile, {
    fileName: 'index.html',
    contentType: 'text/html',
    contentEncoding: 'gzip', // Optional (default: 'identity'), supported encodings are 'identity', 'gzip', 'compress', 'deflate' and 'br'
});
```
```ts
// Log total upload progress of all files
import { AssetManager } from '@slide-computer/assets';

const progress = {};
const eventListener = (event) => {
    if (event.type === 'insert') {
        // Update progress of key in map
        progress[event.key] = event.progress;
        // Get total progress of all files in map
        const {current, total} = Object.values(progress).reduce((acc, val) => {
            acc.current += val.current;
            acc.total += val.total;
        }, { current: 0, total: 0 });
        // Log total progress to console (current bytes / total bytes)
        console.log(`Progress: ${Math.floor(current / total * 100)}%`)
    }
};
const canisterId = ...; // Canister id of the asset canister
const agent = ...; // Agent with an authorized identity
const assetManager = new AssetManager({
    canisterId,
    agent,
    eventListener,
});

const input = document.createElement('input');
input.type = 'file';
input.multiple = true;
input.addEventListener('change', async () => {
    const keys = await Promise.all(Array.from(e.target.files).map(assetManager.insert));
});
input.click();
```

## License

MIT © [https://github.com/slide-computer](https://github.com/slide-computer)