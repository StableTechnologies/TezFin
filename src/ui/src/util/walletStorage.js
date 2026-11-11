/* eslint-env browser */
/* eslint-disable import/prefer-default-export */
import { StorageKey } from '@ecadlabs/beacon-types';

const STORAGE_REVISION_KEY = 'tezfin:wallet-storage-revision';
const STORAGE_REVISION = '1';
const WALLET_DATABASES = ['beacon', 'WALLET_CONNECT_V2_INDEXED_DB'];
const deleteWalletDatabase = (name) => new Promise((resolve, reject) => {
    const request = window.indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('Close other TezFin tabs before refreshing your connection.'));
});
let preparation;

/** Complete the wallet storage transition before loading any wallet provider. */
export function prepareWalletStorage() {
    if (preparation) {
        return preparation;
    }
    const prepare = async () => {
        const storage = window.localStorage;
        if (storage.getItem(STORAGE_REVISION_KEY) === STORAGE_REVISION) {
            return;
        }
        if (!navigator.locks) {
            throw new Error('Please open TezFin in an updated browser to reconnect.');
        }
        // Keep the database and localStorage transition serialized across tabs.
        await navigator.locks.request('tezfin-wallet-storage', async () => {
            if (storage.getItem(STORAGE_REVISION_KEY) === STORAGE_REVISION) {
                return;
            }
            for (let index = 0; index < WALLET_DATABASES.length; index += 1) {
                // Finish each SDK database before clearing state or recording completion.
                // eslint-disable-next-line no-await-in-loop
                await deleteWalletDatabase(WALLET_DATABASES[index]);
            }
            const keys = new Set(Object.values(StorageKey));
            for (let index = 0; index < storage.length; index += 1) {
                const key = storage.key(index);
                if (key?.startsWith('wc@2:')) {
                    keys.add(key);
                }
            }
            keys.forEach((key) => storage.removeItem(key));
            storage.setItem(STORAGE_REVISION_KEY, STORAGE_REVISION);
        });
    };
    preparation = prepare().catch((error) => {
        preparation = undefined;
        throw error;
    });
    return preparation;
}
