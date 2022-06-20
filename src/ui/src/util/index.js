import {
    KeyStoreCurve,
    KeyStoreType,
    TezosNodeReader,
    TezosNodeWriter
} from 'conseiljs';

import { BigNumber } from 'bignumber.js';
import { DAppClient } from '@airgap/beacon-sdk';
import bigInt from 'big-integer';

// eslint-disable-next-line import/no-dynamic-require
const config = require(`../library/${process.env.REACT_APP_ENV || 'prod'}-network-config.json`);

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

/**
 * This function lets a user to connect to a tezos wallet.
 *
 * @returns clients
 */
export const getWallet = async () => {
    const { network } = config.infra.conseilServer;
    const response = await client.requestPermissions({
        network: { type: network }
    });
    const { address } = response;

    return { address };
};

/**
 * This function let's a user disconnects from an account.
 */
export const deactivateAccount = async () => {
    await client.clearActiveAccount();
    // eslint-disable-next-line no-undef
    localStorage.clear();
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
 * @param operations List of operations needed to be sent to the chain.
 *
 * @return operation group.
 */
export const evaluateTransaction = async (operations) => {
    try {
        const address = operations[0].source;
        let curve = KeyStoreCurve.ED25519;
        if (address.startsWith('tz2')) {
            curve = KeyStoreCurve.SECP256K1;
        } else if (address.startsWith('tz3')) {
            curve = KeyStoreCurve.SECP256R1;
        }

        const activeAccount = await client.getActiveAccount();
        const keyStore = {
            publicKey: activeAccount.publicKey,
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
            operations,
            true
        );
        return { opGroup };
    } catch (error) {
        console.log('evaluateTX', error);
        return { error };
    }
};
/**
 * Sends a transaction to the blockchain
 *
 * @param opGroup operation group needed to be sent to the chain
 *
 * @return operation response
 */
export const confirmTransaction = async (opGroup) => {
    try {
        const head = await TezosNodeReader.getBlockHead(config.infra.tezosNode);
        const response = await client.requestOperation({
            operationDetails: opGroup
        });
        return { response: { response, head: head.header.level } };
    } catch (error) {
        console.log(error);
        return { error };
    }
};

/**
 * Confirms transaction completion on conseiljs
 *
 * @param result RPC output
 *
 * @return operation response
 */
export const verifyTransaction = async ({ response, head }) => {
    try {
        const groupid = response.transactionHash
            .replace(/"/g, '')
            .replace(/\n/, ''); // clean up RPC output
        const confirm = await TezosNodeReader.awaitOperationConfirmation(
            config.infra.tezosNode,
            head - 1,
            groupid,
            6
        ).then((res) => {
            if (
                res.contents[0].metadata.operation_result.status === 'applied'
            ) {
                return res;
            }
            throw new Error('operation status not applied');
        });
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

    return Number(
        new BigNumber(val.toString())
            .div(new BigNumber(10).pow(new BigNumber(decimals.toString())))
            .toFixed(formatDecimals)
    );
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
 * This function converts a number to string and truncates it to two decimals without rounding it up.
 * @param num number to truncate.
 *
 * @return truncated value.
 */
export const truncateNum = (num) => num.toString().match(/^-?\d+(?:\.\d{0,2})?/);

/**
 * This function abbreviates a number and returns it as a string with it's suffix.
 * @param  num number to be abbreviated.
 * @param  formatDecimals number to decimal points.
 * @returns abbreviated number in string format.
 */
export const nFormatter = (num, formatDecimals = 4) => {
    const suffix = [
        { value: 1, symbol: '' }, { value: 1e3, symbol: 'k' }, { value: 1e6, symbol: 'M' }, { value: 1e9, symbol: 'B' }
    ];
    let i;
    // eslint-disable-next-line no-plusplus
    for (i = suffix.length - 1; i > 0; i--) {
        if (num >= suffix[i].value) {
            break;
        }
    }

    let formattedNum = new BigNumber(num).dividedBy(suffix[i].value).toString();
    if (formattedNum % 1 !== 0) {
        formattedNum = +formattedNum.slice(
            0,
            formattedNum.toString().indexOf('.') + (formatDecimals + 1)
        );
    }

    return formattedNum + suffix[i].symbol;
};

/**
 * @description THis function takes at percentage ratio as Mantissa 
 * warning! expects the matissa to be of scale = 18
 *
 * @param percentRatio : Mantissa as string
 *
 * @returns PercentageRatio formatted as percent for display
 */

export const displayPercent = (percentRatio) => {
	const expScale18 = bigInt(10).pow(18);

	const number = new BigNumber(percentRatio).dividedBy(expScale18.toString()).multipliedBy(100);
	return number.toString();

}
