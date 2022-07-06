import {ActorConfig, hash} from "@dfinity/agent";
import {assetCanister} from "./did";
import mime from "mime-types";
import pLimit, {LimitFunction} from "p-limit";

type AssetCanister = ReturnType<typeof assetCanister>;

interface AssetManagerConfig extends ActorConfig {
    concurrency?: number;
    maxSingleFileSize?: number;
    maxChunkSize?: number;
    eventListener?: (event: AssetEvent) => void;
}

interface Asset {
    fileName: string;
    path: string;
    content: number[];
    contentType: string;
    contentEncoding: 'identity' | 'gzip' | 'compress' | 'deflate' | 'br';
    sha256?: number[];
}

interface AssetInsert {
    (file: File, options?: Omit<Asset, 'fileName' | 'content' | 'contentType' | 'contentEncoding'> & Partial<Pick<Asset, 'fileName' | 'contentType' | 'contentEncoding'>>): Promise<string>;

    (bytes: Blob | number[] | Uint8Array, options: Omit<Asset, 'content' | 'contentType' | 'contentEncoding'> & Partial<Pick<Asset, 'contentType' | 'contentEncoding'>>): Promise<string>;
}

interface FileToAsset {
    (...args: Parameters<AssetInsert>): Promise<Asset>;
}

interface InsertAssetEvent {
    key: string;
    type: 'insert';
    progress: {
        current: number;
        total: number;
    };
}

interface DeleteAssetEvent {
    key: string;
    type: 'delete';
}

type AssetEvent = InsertAssetEvent | DeleteAssetEvent;

const isBrowser =
    typeof window !== "undefined" && typeof window.document !== "undefined";

const isNode =
    typeof process !== "undefined" &&
    process.versions != null &&
    process.versions.node != null;

const isWebWorker =
    typeof self === "object" &&
    self.constructor &&
    self.constructor.name === "DedicatedWorkerGlobalScope";

const inputToAsset: FileToAsset = async (input, options) => {
    let content: number[];
    let fileName: string = options?.fileName as any;
    let contentType: string = options?.contentType as any;
    let path: string = options?.path ?? '/';
    if (input instanceof Uint8Array) {
        content = Array.from(input);
    } else if (Array.isArray(input) && input.every(b => typeof b === 'number')) {
        content = input;
    } else if (input instanceof Blob) {
        content = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.addEventListener('load', () => {
                resolve(Array.from(Uint8Array.from(reader.result as any)));
            });
            reader.readAsArrayBuffer(input);
        });
        if (!fileName) {
            if (input instanceof File) {
                fileName = input.name;
            } else {
                throw '"fileName" property is required in options';
            }
        }
        if (!contentType) {
            contentType = input.type;
        }
    } else {
        throw 'Asset could not be read (File, Blob, ArrayBuffer, Uint8Array and number[] are valid';
    }
    if (!path.startsWith('/')) {
        path = '/' + path;
    }
    if (!path.endsWith('/')) {
        path = path + '/';
    }
    const contentEncoding = options?.contentEncoding ?? 'identity';
    const sha256 = options?.sha256 ?? Array.from(new Uint8Array(hash(new Uint8Array(content))));

    // If content type is not supplied in either the file or options, detect content type based on filename (extension)
    if (!contentType) {
        contentType = mime.lookup(fileName) || 'application/octet-stream';
    }

    return {
        fileName,
        path,
        content,
        contentType,
        contentEncoding,
        sha256,
    };
};

export class AssetManager {
    private readonly _actor: AssetCanister;
    private readonly _pLimit: LimitFunction;
    private readonly _maxSingleFileSize: number;
    private readonly _maxChunkSize: number;
    private readonly _eventListener: (event: AssetEvent) => void;

    constructor({concurrency, maxSingleFileSize, maxChunkSize, eventListener, ...actorConfig}: AssetManagerConfig) {
        this._actor = assetCanister(actorConfig);
        this._pLimit = pLimit(concurrency ?? 32);
        this._maxSingleFileSize = maxSingleFileSize ?? 450000;
        this._maxChunkSize = maxChunkSize ?? 1900000;
        this._eventListener = eventListener ?? (() => null);
    }

    list = () => this._pLimit(() => this._actor.list({}));

    batch = () => {
        const scheduledOperations: Array<(batch_id: bigint) => Promise<Parameters<AssetCanister['commit_batch']>[0]['operations']>> = [];
        const commit = async () => {
            const {batch_id} = await this._pLimit(() => this._actor.create_batch({}));
            const operations = (await Promise.all(scheduledOperations.map(scheduled_operation => scheduled_operation(batch_id)))).flat();
            await this._pLimit(() => this._actor.commit_batch({batch_id, operations}));
            operations.forEach(operation => {
                if ('DeleteAsset' in operation) {
                    this._eventListener({key: operation.DeleteAsset.key, type: 'delete'});
                }
            })
        };
        const insert: AssetInsert = async (input, options) => {
            const asset = await inputToAsset(input, options);
            const key = [asset.path, asset.fileName].join('');
            this._eventListener({key, type: 'insert', progress: {current: 0, total: asset.content.length}});
            scheduledOperations.push(async batch_id => {
                const chunks = asset.content.reduce((chunks, byte, index) => {
                    const chunkIndex = Math.floor(index / this._maxChunkSize)
                    if (!chunks[chunkIndex]) {
                        chunks[chunkIndex] = [];
                    }
                    chunks[chunkIndex].push(byte)
                    return chunks;
                }, [] as number[][]);
                let progress = 0;
                const chunkIds: bigint[] = await Promise.all(chunks
                    .map(async chunk => {
                        const {chunk_id} = await this._pLimit(() => this._actor.create_chunk({
                            content: chunk,
                            batch_id
                        }));
                        progress += chunk.length;
                        this._eventListener({
                            key,
                            type: 'insert',
                            progress: {current: progress, total: asset.content.length}
                        });
                        return chunk_id;
                    })
                );
                return [
                    {
                        CreateAsset: {key, content_type: asset.contentType}
                    },
                    {
                        SetAssetContent: {
                            key,
                            sha256: asset.sha256 ? [asset.sha256] : [],
                            chunk_ids: chunkIds,
                            content_encoding: asset.contentEncoding
                        }
                    },
                ];
            });
            return key;
        }
        const _delete = async (key: string) => {
            scheduledOperations.push(async () => [{DeleteAsset: {key}}]);
        }

        return {commit, insert, delete: _delete};
    }

    insert: AssetInsert = async (input, options) => {
        const asset = await inputToAsset(input, options);
        const key = [asset.path, asset.fileName].join('');

        if (asset.content.length <= this._maxSingleFileSize) {
            // Asset is small enough to be uploaded in one request
            this._eventListener({key, type: 'insert', progress: {current: 0, total: asset.content.length}});
            await this._pLimit(() => this._actor.store({
                key,
                content: asset.content,
                content_type: asset.contentType,
                sha256: asset.sha256 ? [asset.sha256] : [],
                content_encoding: asset.contentEncoding
            }));
        } else {
            // Create batch to upload asset in chunks
            const batch = this.batch();
            await batch.insert(asset.content, asset);
            await batch.commit();
        }

        return key;
    };

    delete = async (key: string) => {
        await this._pLimit(() => this._actor.delete_content({key}));
        this._eventListener({key, type: 'delete'});
    }
}