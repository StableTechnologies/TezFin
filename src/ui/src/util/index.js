import { DAppClient, TezosOperationType } from '@airgap/beacon-sdk';
import {
    KeyStoreCurve,
    KeyStoreType,
    TezosNodeReader,
    TezosNodeWriter
} from 'conseiljs';

import { Mutex } from 'async-mutex';
import Tezos from '../library/tezos';

// const config = require(`../library/${process.env.REACT_APP_ENV || "prod"}-network-config.json`);
const config = require('../library/dev-network-config.json');

const client = new DAppClient({ name: config.dappName });

/**
 * This function is used to truncate a blockchain address for presentation by replacing the middle digits with an ellipsis.
 *
 * @param {number} first Number of characters to preserve at the front.
 * @param {number} last Number of characters to preserve at the end.
 * @param {string} str Address to format.
 * @returns
 */
export const shorten = (first, last, str) => `${str.substring(0, first)}...${str.substring(str.length - last)}`;

export const connectTezAccount = async () => {
    const { network } = config.infra.conseilServer;
    const resp = await client.requestPermissions({ network: { type: network } });
    const account = await client.getActiveAccount();

    return { client, account: account.address };
};

/**
 * This function lets a user to connect to a tezos wallet.
 *
 * @returns clients
 */
export const getWallet = async () => {
    const { client, account: tezAccount } = await connectTezAccount();
    const mutex = new Mutex();
    const clients = {
        tezos: new Tezos(
            client,
            tezAccount
            // config.tezos.priceOracle,
            // config.tezos.feeContract,
            // config.tezos.RPC,
            // config.tezos.conseilServer,
            // mutex
        )
    };
    return { clients };
};

/**
 * This function let's a user disconnects from an account.
 */
export const deactivateAccount = async () => {
    await client.clearActiveAccount();
};

/**
 * This function checks if the user is already connected to a wallet.
 *
 * @returns address
 */
export const getActiveAccount = async () => {
    const activeAccount = await client.getActiveAccount();

    return activeAccount ? activeAccount.address : undefined;
};

/**
 * Sends a transaction to the blockchain
 *
 * @param operations List of operations needed to be sent to the chain
 *
 * @return operation response
 */
export const confirmOps = async (operations) => {
    try {
        const address = operations[0].source;
        let curve = KeyStoreCurve.ED25519;
        if (address.startsWith('tz2')) {
            curve = KeyStoreCurve.SECP256K1;
        } else if (address.startsWith('tz3')) {
            curve = KeyStoreCurve.SECP256R1;
        }

        const keyStore = {
            publicKey: '', // this precludes reveal operation inclusion
            secretKey: '',
            publicKeyHash: address,
            curve,
            storeType: KeyStoreType.Mnemonic
        };

        const counter = await TezosNodeReader.getCounterForAccount(
            config.infra.tezosNode,
            address
        );
        const opGroup = await TezosNodeWriter.prepareOperationGroup(
            config.infra.tezosNode,
            keyStore,
            counter,
            operations
        );

        return await client.requestOperation({ operationDetails: opGroup });
    } catch (error) {
        console.error('confirmOps', error);
        throw error;
    }
};