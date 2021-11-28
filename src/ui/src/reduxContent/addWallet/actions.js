import {
  Comptroller,
  FToken,
  TezosLendingPlatform,
} from "tezoslendingplatformjs";
import { GET_ACCOUNT, GET_CLIENTS } from "./types.js";

/**
 * This function is used to get the account details of a user.
 *
 * @param  clients
 * @param  server
 * @param  protocolAddresses
 * @param  comptroller
 * @param  markets
 */
export const addWalletAction =
  (address, server, protocolAddresses, comptroller, markets) =>
  async (dispatch) => {
    const account = await TezosLendingPlatform.GetAccount(
      address,
      markets,
      comptroller,
      protocolAddresses,
      server
    );
    console.log("account", account);
    dispatch({ type: GET_ACCOUNT, payload: account });
  };
