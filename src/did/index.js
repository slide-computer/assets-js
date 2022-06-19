import {idlFactory} from './asset_canister.did.js';
import {Actor} from "@dfinity/agent";

/**
 * @type {(configuration: import("@dfinity/agent").ActorConfig) => import("@dfinity/agent").ActorSubclass<import("./asset_canister.did.js")._SERVICE>}
 */
export const assetCanister = (configuration) => Actor.createActor(idlFactory, configuration);
