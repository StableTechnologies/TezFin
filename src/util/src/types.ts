import { AssetType, TokenStandard } from "enum";

import { FToken } from './FToken';
import { InterestRateModel } from "./contracts/InterestRateModel";
import { BigNumber } from 'bignumber.js';

/*
    * @description
    *
    * @param
    */
export interface SupplyComposition {
    assets: { assetType: AssetType, usdValue: bigInt.BigInteger }[];
    collateral: bigInt.BigInteger;
    totalUsdValue: bigInt.BigInteger;
}

/*
    * @description
    *
    * @param
    */
export interface BorrowComposition {
    assets: { assetType: AssetType, usdValue: bigInt.BigInteger }[];
    borrowLimit: bigInt.BigInteger;
    totalUsdValue: bigInt.BigInteger;
}

/*
    * @description
    *
    * @param
    */
export interface SupplyMarket {
    rate: BigNumber;
    balanceUnderlying: BigNumber;
    balanceUsd: bigInt.BigInteger;
    collateral: boolean;
}

/*
    * @description
    *
    * @param
    */
export interface BorrowMarket {
    rate: BigNumber;
    balanceUnderlying: bigInt.BigInteger;
    balanceUsd: bigInt.BigInteger;
    liquidityUnderlying: bigInt.BigInteger;
    liquidityUsd: bigInt.BigInteger;
}

/*
    * @description Information to display for Supply, Withdraw, and Collateralize/Uncollateralize modals
    *
    * @param rate Current rate paid to suppliers. Undefined for Collateralize/Uncollateralize.
    * @param borrowLimit Current borrow limit
    * @param borrowLimitUsed Percentage of account's borrow limit currently used
    */
export interface SupplyMarketModal {
    rate?: BigNumber;
    borrowLimitUsd: bigInt.BigInteger;
    borrowLimitUsed: number
}

/*
    * @description Information to display for Borrow, RepayBorrow modals
    *
    * @param rate Current rate paid by borrowers
    * @param borrowBalance Current USD amount borrowed
    * @param borrowLimitUsed Percentage of account's borrow limit currently used
    */
export interface BorrowMarketModal {
    rate: BigNumber;
    borrowBalanceUsd: bigInt.BigInteger;
    borrowLimitUsed: number;
    borrowBalance: bigInt.BigInteger;
    underlying: string;
    underlyingDecimals: number;
}

export interface OracleMap {
    id: number;
    path: string;
}

/*
    * @description Addresses of the protocol contracts
    *
    * @param fTokens List of fToken contract addresses, e.g. fTokens["XTZ"] == cXTZ contract address.
    * @param underlying Map of underlying assets' metadata.
    * @param comptroller Comptroller contract address
    * @param interestRateModel InterestRateModel contract addresses
    * @param governance Governance contract address
*/
export interface ProtocolAddresses {
    fTokens: { [underlying: string]: string };
    fTokensReverse: { [address: string]: AssetType };
    underlying: { [assetType: string]: UnderlyingAsset };
    comptroller: string;
    interestRateModel: { [underlying: string]: string };
    governance: string;
    oracleMap: { [assetType: string]: OracleMap };
}

/*
    * @description Represents an underlying asset.
    *
    * @param assetType
    * @param address Contract address. Null for XTZ.
    * @param tokenId FA2 token id. Null for XTZ, FA12.
    */
export interface UnderlyingAsset {
    assetType: AssetType;
    tokenStandard: TokenStandard;
    decimals: number;
    address?: string;
    balancesMapId?: number;
    balancesPath?: string;
    tokenId?: number;
}

/*
    * @description Represents metadata about a fToken contract.
    *
    * @param name Name of the underlying asset, e.g. Tezos.
    * @param underlying Underlying asset identifier object
    * @param administrator Address of the fToken contract administrator, e.g. the governance contract.
    * @param price Price according to the protocol's price oracle.
    */
export interface UnderlyingAssetMetadata {
    name: string;
    underlying: UnderlyingAsset;
    administrator: string;
    price: bigInt.BigInteger;
}

/*
    * @description Represents the status of one side of a fToken's market (either supply or borrow)
    *
    * @param numParticipants The number of unique addresses in the market
    * @param totalAmount The total number of tokens in the market, fTokens for supply and underlying for borrow
    * @param rate Current interest rate
    */
export interface MarketData {
    numParticipants: number;
    totalAmount: bigInt.BigInteger;
    rate: bigInt.BigInteger;
}

/*
    * Description
    *
    * @param address fToken contract address
    * @param asset Asset metadata
    * @param cash Amount of underlying fToken held by contract
    * @param supply Supply side data
    * @param borrow Borrow side data
    * @param dailyInterestPaid Amount of underlying paid in interest, daily
    * @param reserves
    * @param reserveFactor
    * @param collateralFactor The collateral factor required for this asset
    * @param exchangeRate The fToken/underlying exchange rate. This increases as supply rate accrues
    */
export interface Market {
    address: string;
    asset: UnderlyingAssetMetadata;
    cash: bigInt.BigInteger;
    cashUsd: bigInt.BigInteger;
    supply: MarketData;
    borrow: MarketData;
    dailyInterestPaid: bigInt.BigInteger;
    reserves: bigInt.BigInteger;
    currentPrice: bigInt.BigInteger;
    reserveFactor: number;
    collateralFactor: number;
    exchangeRate: BigNumber;
    storage: FToken.Storage;
    rateModel: InterestRateModel.Storage;
}

export type MarketMap = { [assetType: string]: Market }

/*
    * @description
    *
    * @param address Account address
    * @param underlyingBalances Account's balances across underlying tokens
    * @param marketBalances Account balances across all markets
    * @param totalCollateralUsd Total USD value of collateral
    * @param totalLoanUsd Total USD value of loans
    * @param health Account LTV ratio, totalCollateralUsd / totalLoanUsd expressed as bps
    * @param rate Current net account rate across all markets, both supply and borrow, weighted by balance
    */
export interface Account {
    address: string;
    underlyingBalances: { [asset: string]: BigNumber };
    marketBalances: FToken.BalanceMap;
    totalSupplyingUsd: bigInt.BigInteger;
    totalCollateralUsd: bigInt.BigInteger;
    totalLoanUsd: bigInt.BigInteger;
    health: number;
    rate: number;
}
