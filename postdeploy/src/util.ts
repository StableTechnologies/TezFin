import * as ComptrollerHelper from "./comptroller";
import * as DeployHelper from "./deploy";
import * as FTokenHelper from "./ftoken";
import * as config from "../config/config.json";

import {
  AssetType,
  Comptroller,
  FToken,
  Governance,
  mainnetAddresses,
  PriceFeed,
  ProtocolAddresses,
  testnetAddresses,
  TezosLendingPlatform,
  TokenStandard,
  UnderlyingAsset,
} from "tezoslendingplatformjs";
import {
  ConseilServerInfo,
  KeyStore,
  MultiAssetTokenHelper,
  Signer,
  TezosConseilClient,
  TezosContractUtils,
  TezosMessageUtils,
  TezosNodeReader,
  TezosNodeWriter,
  TezosParameterFormat,
  Tzip7ReferenceTokenHelper,
  registerFetch,
  registerLogger,
} from "conseiljs";
import { CryptoUtils, KeyStoreUtils, SoftSigner } from "conseiljs-softsigner";
import log, { LogLevelDesc } from "loglevel";
import { JSONPath } from "jsonpath-plus";
import fetch from "node-fetch";
import fs from "fs";

export async function initConseil() {
  log.setLevel(config.loglevel as LogLevelDesc);
  const logger = log.getLogger("conseiljs");
  logger.setLevel(config.loglevel as LogLevelDesc, false);
  registerLogger(logger);
  registerFetch(fetch);
  TezosLendingPlatform.initConseil(config.loglevel as LogLevelDesc);
}

export async function initKeystore(keystoreConfig: any = undefined): Promise<{
  keystore: KeyStore;
  signer: Signer;
}> {
  log.debug(`Reading faucet wallet file`);
  // const keystoreJSON = JSON.parse(fs.readFileSync(config.keystorePath, 'utf8'));
  if (keystoreConfig == null) {
    keystoreConfig = config.keystore;
  }
  let keystore = await KeyStoreUtils.restoreIdentityFromFundraiser(
    keystoreConfig.mnemonic.join(" "),
    keystoreConfig.email,
    keystoreConfig.password,
    keystoreConfig.pkh
  );
  let signer = await SoftSigner.createSigner(
    TezosMessageUtils.writeKeyWithHint(keystore.secretKey, "edsk")
  );

  if (config.revealAccount) {
    log.info(`Activating account.`);
    const activateNodeResult =
      await TezosNodeWriter.sendIdentityActivationOperation(
        config.tezosNode,
        signer,
        keystore,
        keystoreConfig.activation_code
      );
    statOperation(activateNodeResult);
    log.info(`Revealing Account.`);
    const revealNodeResult = await TezosNodeWriter.sendKeyRevealOperation(
      config.tezosNode,
      signer,
      keystore
    );
    statOperation(revealNodeResult);
  }
  return { keystore, signer };
}

export async function deploy() {
  await initConseil();
  const { keystore, signer } = await initKeystore();
  // protocolAddresses = parseProtocolAddress(config.protocolAddressesPath);
  const protocolAddresses = testnetAddresses;
  log.info(`protocolAddresses: ${JSON.stringify(protocolAddresses!)}`);

  await DeployHelper.postDeploy(keystore!, signer!, protocolAddresses!);

  // Testnet only!
  await DeployHelper.mintFakeTokens(
    keystore!,
    signer!,
    protocolAddresses!,
    keystore.publicKeyHash
  );
  await DeployHelper.setOracle(
    keystore!,
    signer!,
    protocolAddresses!,
    protocolAddresses.oracle,
    31104000 // 12 months
  );
  // set default value for USDT
  await FTokenHelper.updatePrice(
    [{ asset: "USDT" as AssetType, price: 1 * Math.pow(10, 6) }],
    protocolAddresses.oracle,
    keystore!,
    signer!,
    protocolAddresses!
  );
}

export async function batchMint(records: string[][]) {
  await initConseil();
  const { keystore, signer } = await initKeystore();
  // protocolAddresses = parseProtocolAddress(config.protocolAddressesPath);
  const protocolAddresses = testnetAddresses;
  log.info(`protocolAddresses: ${JSON.stringify(protocolAddresses!)}`);

  for (let rec of records)
    await DeployHelper.mintFakeTokens(
      keystore!,
      signer!,
      protocolAddresses!,
      rec[0]
    );
}

export async function statOperation(result) {
  if (result["status"] === "failed") {
    console.log(
      `${result["kind"]} ${result["operation_group_hash"]} ${result["status"]} at block ${result["block_level"]}`
    );
  } else if (result["status"] === "applied") {
    let message = `\t${result["kind"]} ${result["operation_group_hash"]} included in block ${result["block_level"]}.
            from ${result["source"]} to ${result["destination"]}
            gas cost: ${result["consumed_gas"]}
            storage cost: ${result["paid_storage_size_diff"]}`;

    if (
      "originated_contracts" in result &&
      result["originated_contracts"] != null &&
      result["originated_contracts"].length > 0
    ) {
      message += `\n\tnew contract originated at ${result["originated_contracts"]}`;
    }

    console.log(message);
  } else {
    console.log(JSON.stringify(result));
  }
}

export async function parseProtocolAddress(path: string) {
  const protocolAddressesJSON = JSON.parse(fs.readFileSync(path, "utf8"));
  const fTokensReverse = {};
  fTokensReverse[protocolAddressesJSON.CXTZ] = AssetType.XTZ;
  fTokensReverse[protocolAddressesJSON.CETHtz] = AssetType.ETH;
  fTokensReverse[protocolAddressesJSON.CUSDtz] = AssetType.USD;
  fTokensReverse[protocolAddressesJSON.CBTCtz] = AssetType.BTC;
  const oracleStorage = await TezosNodeReader.getContractStorage(
    config.tezosNode,
    protocolAddressesJSON.TezFinOracle
  );
  const oracleMap = Number(
    JSONPath({ path: "$.args[2].int", json: oracleStorage })[0]
  );
  const protoAddress: ProtocolAddresses = {
    fTokens: {
      BTC: protocolAddressesJSON.CBTCtz,
      XTZ: protocolAddressesJSON.CXTZ,
      ETH: protocolAddressesJSON.CETHtz,
      USD: protocolAddressesJSON.CUSDtz,
    },
    fTokensReverse: fTokensReverse,
    underlying: {
      ETH: {
        assetType: AssetType.ETH,
        tokenStandard: TokenStandard.FA12,
        decimals: 18,
        address: protocolAddressesJSON.ETHtz,
        balancesMapId: 34651,
        balancesPath: "$.args[1].int",
      },
      USD: {
        assetType: AssetType.USD,
        address: protocolAddressesJSON.USDtz,
        balancesMapId: 34654,
        tokenStandard: TokenStandard.FA12,
        decimals: 6,
        balancesPath: "$.args[1].int",
      },
      BTC: {
        assetType: AssetType.BTC,
        tokenStandard: TokenStandard.FA2,
        decimals: 8,
        address: protocolAddressesJSON.BTCtz,
        tokenId: 0,
        balancesMapId: 34646,
        balancesPath: "$.int",
      },
      XTZ: {
        assetType: AssetType.XTZ,
        tokenStandard: TokenStandard.XTZ,
        decimals: 6,
      },
    },
    comptroller: protocolAddressesJSON.Comptroller,
    interestRateModel: {
      XTZ: protocolAddressesJSON.CXTZ_IRM,
      ETH: protocolAddressesJSON.CFA12_IRM,
      USD: protocolAddressesJSON.CFA12_IRM,
      BTC: protocolAddressesJSON.CFA2_IRM,
    },
    governance: protocolAddressesJSON.Governance,
    oracle: protocolAddressesJSON.TezFinOracle,
  };
  protoAddress.underlying =
    await TezosLendingPlatform.PopulateTokenBalanceMapIDs(
      protoAddress.underlying,
      config.tezosNode
    );
  return {
    protoAddress,
    oracle: protocolAddressesJSON.TezFinOracle,
  };
}
