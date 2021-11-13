import {
  ConseilDataClient,
  ConseilOperator,
  ConseilSortDirection,
  TezosConseilClient,
  TezosLanguageUtil,
  TezosMessageUtils,
  TezosNodeReader,
  TezosParameterFormat
} from "conseiljs";

import { JSONPath } from "jsonpath-plus";
import { TezosOperationType } from "@airgap/beacon-sdk";
import { constants } from "./util";

export default class Tezos {
  constructor(tezos, account, priceContract, feeContract, rpc, conseilServer, mutex) {
    this.account = account; // tezos wallet address
    this.tezos = tezos; //tezos beacon-sdk instance
    this.rpc = rpc; // rpc server address for network interaction
    this.conseilServer = conseilServer; // conseil server setting
    this.priceContract = priceContract; // tezos harbinger oracle contract details {address:string, mapID:nat}
    this.feeContract = feeContract; // tezos tx fee contract details {address:string, mapID:nat}
    this.mutex = mutex; // mutex
  }

  /**
   * Get the tezos balance for an account
   *
   * @param address tezos address for the account
   */
   async balance(address) {
    return await TezosNodeReader.getSpendableBalanceForAccount(
      this.rpc,
      address
    );
  }

  /**
    * Get the tezos fa1.2 token balance for an account
    *
    * @param tokenContract tezos fa1.2 token contract details {address:string, mapID:nat, type:string, tokenID:nat}
    * @param address tezos address for the account
    */
   async tokenBalance(tokenContract, address) {
     if (tokenContract.type === constants.tokenTypes.FA2) {
       const accountHex = `0x${TezosMessageUtils.writeAddress(address)}`;
       const packedKey = TezosMessageUtils.encodeBigMapKey(
         Buffer.from(
           TezosMessageUtils.writePackedData(
             `(Pair ${accountHex} ${tokenContract.tokenID})`,
             "",
             TezosParameterFormat.Michelson
           ),
           "hex"
         )
       );

       let mapResult = undefined;
       try {
         mapResult = await TezosNodeReader.getValueForBigMapKey(
           this.rpc,
           tokenContract.mapID,
           packedKey
         );
       } catch (err) {
         if (
           !(
             Object.prototype.hasOwnProperty.call(err, "httpStatus") &&
             err.httpStatus === 404
           )
         )
           throw err;
       }

       const balance =
         mapResult === undefined
           ? "0"
           : JSONPath({ path: "$.int", json: mapResult })[0];
       return balance;
     }
     let key = TezosMessageUtils.encodeBigMapKey(
       Buffer.from(TezosMessageUtils.writePackedData(address, "address"), "hex")
     );
     if (tokenContract.mapID === 31) {
       key = Buffer.from(
         TezosMessageUtils.writePackedData(
           `(Pair "ledger" 0x${TezosMessageUtils.writeAddress(address)})`,
           "",
           TezosParameterFormat.Michelson
         ),
         "hex"
       );
       key = TezosMessageUtils.encodeBigMapKey(
         Buffer.from(TezosMessageUtils.writePackedData(key, "bytes"), "hex")
       );
     }
     let tokenData = undefined;
     try {
       tokenData = await TezosNodeReader.getValueForBigMapKey(
         this.rpc,
         tokenContract.mapID,
         key
       );
     } catch (err) {
       if (
         !(
           Object.prototype.hasOwnProperty.call(err, "httpStatus") &&
           err.httpStatus === 404
         )
       )
         throw err;
     }
     if (tokenContract.mapID === 31 && tokenData !== undefined) {
       tokenData = JSON.parse(
         TezosLanguageUtil.hexToMicheline(
           JSONPath({ path: "$.bytes", json: tokenData })[0].slice(2)
         ).code
       );
     }
     let balance =
       tokenData === undefined
         ? "0"
         : JSONPath({ path: "$.args[0].int", json: tokenData })[0];
     return balance;
   }

    /**
   * Send a tx to the blockchain
   *
   * @param operations List of operations needed to be sent to the chain
   * @param extraGas extra gas to add for the tx (user choice)
   * @param extraStorage extra storage to add for the tx (user choice)
   *
   * @return operation result
   */
  async interact(operations, extraGas = 500, extraStorage = 50) {
    await this.mutex.acquire();
    try {
      let ops = [];
      operations.forEach((op) => {
        ops.push({
          kind: TezosOperationType.TRANSACTION,
          amount: op.amtInMuTez,
          destination: op.to,
          source: this.account,
          parameters: {
            entrypoint: op.entrypoint,
            value: JSON.parse(
              TezosLanguageUtil.translateParameterMichelsonToMicheline(
                op.parameters
              )
            ),
          },
        });
      });
      const result = await this.tezos.requestOperation({
        operationDetails: ops,
      });
      console.log(result);
      const groupid = result["transactionHash"]
        .replace(/"/g, "")
        .replace(/\n/, ""); // clean up RPC output
      const confirm = await TezosConseilClient.awaitOperationConfirmation(
        this.conseilServer,
        this.conseilServer.network,
        groupid,
        2
      );
      return confirm;
    } catch (err) {
      console.error(err);
      throw err;
    } finally {
      this.mutex.release();
    }
  }
}