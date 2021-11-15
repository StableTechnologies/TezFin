// import { BigNumber } from "bignumber.js";
import { DAppClient } from "@airgap/beacon-sdk";
import { Mutex } from "async-mutex";
import Tezos from "../library/tezos";
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

export const getAssetsDetails = ()=> {
  const assets = config.assets;
  return assets
}
