// import { BigNumber } from "bignumber.js";
import { DAppClient, TezosOperationType } from "@airgap/beacon-sdk";
import { Mutex } from "async-mutex";
import Tezos from "../library/tezos";
import { TezosLanguageUtil } from "conseiljs";

// const config = require(`../library/${process.env.REACT_APP_ENV || "prod"
//   }-network-config.json`);
const config = require('../library/dev-network-config.json');


/**
 * This function is used to truncate a blockchain address for presentation by replacing the middle digits with an ellipsis.
 *
 * @param {number} first Number of characters to preserve at the front.
 * @param {number} last Number of characters to preserve at the end.
 * @param {string} str Address to format.
 * @returns
 */
 export const shorten = (first, last, str) => {
  return str.substring(0, first) + "..." + str.substring(str.length - last);
};

export const connectTezAccount = async () => {
  const client = new DAppClient({ name: "TEZFIN" });
  // const network =
    // config.tezos.conseilServer.network === "mainnet" ? "mainnet" : "granadanet";
    const network = "granadanet";
  const resp = await client.requestPermissions({
    network: { type: network },
  });
  const account = await client.getActiveAccount();
  return { client, account: account["address"] };
};

/**
 * This function lets a user to connect to a tezos wallet.
 *
 * @returns clients
 */
export const getWallet = async () => {
  const { client, account: tezAccount } = await connectTezAccount();

  const mutex = new Mutex()
  const clients = {
    tezos: new Tezos(
      client,
      tezAccount,
      // config.tezos.priceOracle,
      // config.tezos.feeContract,
      // config.tezos.RPC,
      // config.tezos.conseilServer,
      // mutex
    )
  };
  return { clients };
};

export const getAssetsDetails = () => {
  const assets = config.assets;
  return assets
}

/**
 * Sends a transaction to the blockchain
 *
 * @param operations List of operations needed to be sent to the chain
 *
 * @return operation response
 */
export const confirmOps = async ( operations ) => {
  const client = new DAppClient({ name: "TEZFIN" });

  try {
    let ops = [];
    operations.forEach((x) => {
      ops.push({
        kind: x.kind,
        amount: 1,
        destination: x.destination,
        source: x.source,
        parameters: {
          entrypoint: x.entrypoint,
          value: 1,
        // value: JSON.parse(
        //   TezosLanguageUtil.translateParameterMichelsonToMicheline(
        //       x.value
        //   )
        // ),
      },
    });
  });
  const response = await client.requestOperation({
    operationDetails: ops,
  });
  console.log(response, 'response');
  return response;
  }
  catch (error) {
    console.log(error, 'error');
    throw error;
  }
}
