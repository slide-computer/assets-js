import { ActorConfig } from "@dfinity/agent";
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
declare type AssetEvent = InsertAssetEvent | DeleteAssetEvent;
export declare class AssetManager {
    private readonly _actor;
    private readonly _pLimit;
    private readonly _maxSingleFileSize;
    private readonly _maxChunkSize;
    private readonly _eventListener;
    constructor({ concurrency, maxSingleFileSize, maxChunkSize, eventListener, ...actorConfig }: AssetManagerConfig);
    list: () => Promise<{
        key: string;
        encodings: {
            modified: bigint;
            sha256: [] | [number[]];
            length: bigint;
            content_encoding: string;
        }[];
        content_type: string;
    }[]>;
    batch: () => {
        commit: () => Promise<void>;
        insert: AssetInsert;
        delete: (key: string) => Promise<void>;
    };
    insert: AssetInsert;
    delete: (key: string) => Promise<void>;
}
export {};
