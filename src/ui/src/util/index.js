import { TezosToolkit, OpKind } from '@taquito/taquito';
import { BeaconWallet } from '@taquito/beacon-wallet';
import { NetworkType } from '@taquito/beacon-wallet/types';
import BigNumber from 'bignumber.js';
import bigInt from 'big-integer';

// eslint-disable-next-line import/no-dynamic-require
const config = require(`../library/${process.env.REACT_APP_ENV || 'mainnet'}-network-config.json`);

const Tezos = new TezosToolkit(config.infra.tezosNode);
// Temple Wallet doesn't support tezosx-previewnet natively — use 'custom' network type.
// For mainnet/shadownet omit rpcUrl: some mobile wallets (e.g. Kukai iOS) treat a custom
// rpcUrl as a different network and reject the permission request.
const beaconNetwork = config.infra.network === 'tezosx-previewnet'
    ? { type: NetworkType.CUSTOM, rpcUrl: config.infra.tezosNode, name: 'TezosX Previewnet' }
    : { type: config.infra.network };
const wallet = new BeaconWallet({ name: config.dappName, network: beaconNetwork });
Tezos.setWalletProvider(wallet);

/**
 * This function is used to truncate a blockchain address for presentation by replacing the middle digits with an ellipsis.
 *
 * @param {number} first Number of characters to preserve at the front.
 * @param {number} last Number of characters to preserve at the end.
 * @param {string} str Address to format.
 * @returns
 */
export const shorten = (first, last, str) => `${str.substring(0, first)}...${str.substring(str.length - last)}`;

/**
 * This function lets a user to connect to a tezos wallet.
 *
 * @returns clients
 */
export const getWallet = async () => {
    await wallet.requestPermissions();
    const address = await wallet.getPKH();
    return { address };
};

/**
 * This function let's a user disconnects from an account.
 */
export const deactivateAccount = async () => {
    await wallet.clearActiveAccount();
    // eslint-disable-next-line no-undef
    localStorage.clear();
};

/**
 * This function checks if the user is already connected to a wallet.
 *
 * @returns address
 */
export const getActiveAccount = async () => {
    const activeAccount = await wallet.client.getActiveAccount();
    return activeAccount ? activeAccount.address : undefined;
};

/**
 * Estimates a batch of operations and returns the batch ready to send.
 *
 * @param operations List of TransferParams to estimate.
 *
 * @return batch operation ready to send.
 */
export const evaluateTransaction = async (operations) => {
    try {
        // On previewnet estimation is unreliable — let the wallet estimate
        if (config.infra.network === 'tezosx-previewnet') {
            const batch = Tezos.wallet.batch(
                operations.map(op => ({ ...op, kind: OpKind.TRANSACTION }))
            );
            return { opGroup: batch };
        }
        // estimate each operation to get gas/storage/fee limits
        const paramsWithKind = operations.map(op => ({ ...op, kind: OpKind.TRANSACTION }));
        const estimates = await Tezos.estimate.batch(paramsWithKind);
        // apply estimates to operations
        const estimatedOps = operations.map((op, i) => ({
            ...op,
            kind: OpKind.TRANSACTION,
            gasLimit: estimates[i].gasLimit,
            storageLimit: estimates[i].storageLimit,
            fee: estimates[i].suggestedFeeMutez,
        }));
        const batch = Tezos.wallet.batch(estimatedOps);
        return { opGroup: batch };
    } catch (error) {
        console.log('evaluateTX', error);
        return { error };
    }
};

/**
 * Sends a prepared batch to the blockchain.
 *
 * @param batch Taquito wallet batch operation.
 *
 * @return operation response
 */
export const confirmTransaction = async (batch) => {
    try {
        const op = await batch.send();
        return { response: op };
    } catch (error) {
        console.log(error);
        return { error };
    }
};

/**
 * Waits for operation confirmation on-chain.
 *
 * @param op Taquito batch wallet operation.
 *
 * @return operation response
 */
export const verifyTransaction = async (op) => {
    try {
        const confirm = await op.confirmation(1);
        return { confirm };
    } catch (error) {
        console.log(error);
        return { error };
    }
};

/**
 * This function that takes a number/string and the number of decimals and returns the decimal version of that number.
 *
 * @returns decimal version
 */
export const decimalify = (val, decimals, formatDecimals = 4) => {
    if (!val) {
        return val;
    }

    return new BigNumber(val.toString())
        .div(new BigNumber(10).pow(new BigNumber(decimals.toString())))
        .toFixed(formatDecimals);
};

/**
 * This function that takes a decimal number/string and the number of decimals and returns the non decimal version of that number as string type.
 *
 * @returns decimal version
 */
export const undecimalify = (val, decimals) => {
    if (!val) {
        return val;
    }

    return new BigNumber(val.toString())
        .multipliedBy(new BigNumber(10).pow(new BigNumber(decimals.toString())))
        .toFixed(0);
};

/**
 * Format token data for display in the market table.
 */
export function formatTokenData(data) {
    const filtered = data.filter((i) => bigInt(i.balanceUnderlying).gt(0));
    return filtered;
}

/**
 * This function converts a number to string and truncates it to two decimals without rounding it.
 * @param num number to truncate.
 *
 * @return truncated value.
 */
export const truncateNum = (num) => num.toString().match(/^-?\d+(?:\.\d{0,2})?/);

/**
 * This function rounds a value to a specified number of decimals.
 * @param num number to truncate.
 * @param decimals decimal places to round.
 *
 * @return formatted value.
 */
export const roundValue = (num, decimals = 2) => BigNumber(num).toFixed(decimals);

/**
 * This function abbreviates a number and returns it as a string with it's suffix.
 * @param  num number to be abbreviated.
 * @param  formatDecimals number to decimal points.
 * @returns abbreviated number in string format.
 */
// eslint-disable-next-line default-param-last
export const nFormatter = (num, formatDecimals = 4) => {
    const suffix = [
        { value: 1, symbol: '' },
        { value: 1e3, symbol: 'k' },
        { value: 1e6, symbol: 'M' },
        { value: 1e9, symbol: 'B' },
    ];
    let i;
    // eslint-disable-next-line no-plusplus
    for (i = suffix.length - 1; i > 0; i--) {
        if (num >= suffix[i].value) {
            break;
        }
    }

    let formattedNum = new BigNumber(num).dividedBy(suffix[i].value).toFixed();
    if (formattedNum % 1 !== 0) {
        formattedNum = +formattedNum.slice(0, formattedNum.toString().indexOf('.') + (formatDecimals + 1));
    }
    return (
        BigNumber(formattedNum)
            .toString()
            .match(/^-?\d+(?:\.\d{0,2})?/) + suffix[i].symbol
    );
};

export const getExplorerLink = () => {
    switch (config.infra.network) {
    case 'mainnet':
        return 'https://tzkt.io';
    case 'shadownet':
        return 'https://shadownet.tzkt.io';
    case 'tezosx-previewnet':
        return 'https://previewnet.tezosx.tzkt.io';
    default:
        return 'https://tzkt.io';
    }
};
