import { ConseilQuery, ConseilServerInfo, KeyStore, MultiAssetTokenHelper, Signer, TezosConseilClient, TezosContractUtils, TezosMessageUtils, TezosNodeReader, TezosNodeWriter, Transaction, Tzip7ReferenceTokenHelper, UpdateOperator } from 'conseiljs';

import { Comptroller } from './Comptroller';
import { FToken } from './FToken';
import { JSONPath } from 'jsonpath-plus';
import bigInt from 'big-integer';
import log from 'loglevel';

export namespace TezosLendingPlatform {
    /*
     * @description Enum identifying assets in the protocol. Corresponds to the string of the asset's symbol.
     *
     */
    export enum AssetType {
        XTZ = "XTZ",
        FA12 = "FA12",
        FA2 = "FA2",
        ETH = "ETH",
        BTC = "BTC"
    }

    export enum TokenStandard {
        XTZ = 0,
        FA12,
        FA2
    }

    export function assetTypeToStandard(asset: AssetType) {
        if ([AssetType.FA12, AssetType.ETH].includes(asset)) {
            return TokenStandard.FA12;
        } else if ([AssetType.FA2, AssetType.BTC].includes(asset)) {
            return TokenStandard.FA2;
        } else
            return TokenStandard.XTZ;
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
        priceFeed: string;
    }

    /*
     * @description
     *
     * @param
     */
    export const tokenNames: { [assetType: string]: string } = {
        "ETH": "ETH",
        "BTC": "BTC"
    };

    /*
     * @description placeholder
     *
     * @param
     */
    export const granadanetAddresses: ProtocolAddresses = {
        fTokens: {
            "XTZ": "KT1Gbc2VCqF7W5TQiGszSM49nckf9igYmj3M",
            "ETH": "KT1VGLyMmt11c4adNArXYH9dPaB7LLXoz8K5",
            "BTC": "KT1Mr7BTETa2qtEJ2Y7by1pMAfHZhzWfH2Bk"
        },
        fTokensReverse: {
            "KT1Gbc2VCqF7W5TQiGszSM49nckf9igYmj3M": AssetType.XTZ,
            "KT1VGLyMmt11c4adNArXYH9dPaB7LLXoz8K5": AssetType.ETH,
            "KT1Mr7BTETa2qtEJ2Y7by1pMAfHZhzWfH2Bk": AssetType.BTC
        },
        underlying: {
            "ETH": {
                assetType: AssetType.ETH,
                address: "KT1TVRtzyN7QysJquDBD6e36Etzj3w7jxReQ",
                balancesMapId: 39991
            },
            "BTC": {
                assetType: AssetType.BTC,
                address: "KT1JqmwY3JJoHN7uh75pALrAx6sSpRbEZc9R",
                tokenId: 0,
                balancesMapId: 39994
            },
            "XTZ": {
                assetType: AssetType.XTZ
            }
        },
        comptroller: "KT1AD8rvgSHoM8SrNRzCVxLpDM6eKFgNH3kU",
        interestRateModel: {
            "XTZ": "KT1NRFY1vtLGh2buux35uQpabyJRsqYjSAVB",
            "ETH": "KT1R1vM6rVnR532w95E7cGAYY3rSNz8hq8fi",
            "BTC": "KT1BkEsTJDGpKugb86zdFyVm3EvuT2aeoyz6"
        },
        governance: "KT1A7VB84jAoQyqBxy5rghfvDkPaQi6XRTyp",
        priceFeed: "KT1PMQZxQTrFPJn3pEaj9rvGfJA9Hvx7Z1CL"
    };

    /*
     * @description TODO: convert mantissa to number
     *
     * @param
     */
    export function ConvertFromMantissa(mantissa: bigInt.BigInteger): bigInt.BigInteger {
        return bigInt(mantissa);
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
        rate: number;
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
        reserveFactor: number;
        collateralFactor: number;
        exchangeRate: number;
        storage: FToken.Storage;
    }

    export type MarketMap = { [assetType: string]: Market }

    /*
     * @description Converts an fToken contract's storage to Market object
     *
     * @param fToken The fToken contract's storage
     */
    export function MakeMarket(fToken: FToken.Storage, comptroller: Comptroller.Storage, address: string, underlying: UnderlyingAsset): Market {
        const asset: UnderlyingAssetMetadata = {
            name: tokenNames[underlying.assetType],
            underlying: underlying,
            administrator: fToken.administrator,
            price: comptroller.markets[underlying.assetType].price
        };
        const supply: MarketData = {
            // numParticipants: fToken.supply.numSuppliers?,
            numParticipants: 0,
            totalAmount: fToken.supply.totalSupply,
            rate: FToken.GetSupplyRate(fToken)
        };
        const borrow: MarketData = {
            // numParticipants: fToken.borrow.numBorrowers,
            numParticipants: 0,
            totalAmount: fToken.borrow.totalBorrows,
            rate: FToken.GetBorrowRate(fToken)
        };
        // TODO: fix fraction
        // const reserveFactor = 1 / ConvertFromMantissa(fToken.reserveFactorMantissa);
        return {
            address: address,
            asset: asset,
            cash: FToken.GetCash(fToken),
            cashUsd: comptroller.markets[underlying.assetType].price.multiply(FToken.GetCash(fToken)),
            supply: supply,
            borrow: borrow,
            dailyInterestPaid: bigInt('0'), // TODO: parse this
            reserves: fToken.totalReserves,
            reserveFactor: 0,
            collateralFactor: comptroller.markets[underlying.assetType].collateralFactor,
            exchangeRate: FToken.GetExchangeRate(fToken),
            storage: fToken
        } as Market;
    }

    /*
     * @description Gets the market data for all markets in protocolAddresses
     *
     * @param address The fToken contract address to query
     * @param server Tezos node URL
     */
    export async function GetMarkets(comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string): Promise<MarketMap> {
        // get storage for all contracts
        let markets: MarketMap = {};
        await Promise.all(Object.keys(protocolAddresses.fTokens).map(async (asset) => {
            const fTokenAddress = protocolAddresses.fTokens[asset];
            const fTokenType = assetTypeToStandard(protocolAddresses.fTokensReverse[fTokenAddress])
            try {
                const fTokenStorage: FToken.Storage = await FToken.GetStorage(fTokenAddress, server, fTokenType);
                markets[asset] = MakeMarket(fTokenStorage, comptroller, fTokenAddress, protocolAddresses.underlying[asset]);
            } catch (e) {
                log.error(`Failed in GetMarkets for ${asset} at ${protocolAddresses.fTokens[asset]} and ${JSON.stringify(protocolAddresses.underlying[asset])} with ${e}`);
                log.error(`Comptroller state: ${JSON.stringify(comptroller)}`);
            }
        }));
        return markets;
    }

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
        underlyingBalances: { [asset: string]: bigInt.BigInteger };
        marketBalances: FToken.BalanceMap;
        totalSupplyingUsd: bigInt.BigInteger;
        totalCollateralUsd: bigInt.BigInteger;
        totalLoanUsd: bigInt.BigInteger;
        health: number;
        rate: number;
    }

    /*
     * @description Returns the accout corresponding to address.
     *
     * @param address Address of the requested account
     * @param markets List of fToken markets
     * @param comptroller Comptroller storage
     * @param protocolAddresses
     * @param server Tezos node
     */
    export async function GetAccount(address: string, markets: MarketMap, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string): Promise<Account> {
        // check which markets are collaterals
        const collaterals = await Comptroller.GetCollaterals(address, comptroller, protocolAddresses, server);
        // get balance in each underlying
        const underlyingBalances = await GetUnderlyingBalances(address, markets, server);
        // get balance in each market
        const marketBalances = await GetFtokenBalances(address, markets, server);

        // get prices from oracle
        // calculate usd balances and collaterals
        for (const asset in marketBalances) {
            marketBalances[asset].supplyBalanceUsd = comptroller.markets[asset].price.multiply(marketBalances[asset].supplyBalanceUnderlying);
            marketBalances[asset].loanBalanceUsd = comptroller.markets[asset].price.multiply(marketBalances[asset].loanBalanceUnderlying);
            marketBalances[asset].collateral = collaterals.includes(asset as AssetType);
        }

        // calculate total collateral and loan balance
        let totalSupplyingUsd = bigInt(0);
        let totalCollateralUsd = bigInt(0);
        let totalLoanUsd = bigInt(0);
        for (const asset in marketBalances) {
            if (marketBalances[asset].collateral!) {
                totalCollateralUsd = totalCollateralUsd.add(marketBalances[asset].supplyBalanceUsd!);
            }
            totalSupplyingUsd = totalSupplyingUsd.add(marketBalances[asset].supplyBalanceUsd!);
            totalLoanUsd = totalLoanUsd.add(marketBalances[asset].loanBalanceUsd!);
        }

        // calculate aggregate account rate
        const rate = calculateAccountRate(totalCollateralUsd, marketBalances, markets);
        return {
            address: address,
            underlyingBalances: underlyingBalances,
            marketBalances: marketBalances,
            totalSupplyingUsd: totalSupplyingUsd,
            totalCollateralUsd: totalCollateralUsd,
            totalLoanUsd: totalLoanUsd,
            health: calculateHealth(totalCollateralUsd, totalLoanUsd),
            rate: rate
        } as Account;
    }

    /*
     * @description
     *
     * @param
     */
    export async function GetFtokenBalances(address: string, markets: MarketMap, server: string): Promise<FToken.BalanceMap> {
        let balances: FToken.BalanceMap = {};
        await Promise.all(Object.keys(markets).map(async (asset) => {
            balances[asset] = await FToken.GetBalance(address, asset as AssetType, markets[asset].storage.borrow.borrowIndex, markets[asset].storage.balancesMapId, server);
        }));
        return balances;
    }

    /*
     * @description
     *
     * @param
     */
    export async function GetUnderlyingBalances(address: string, markets: MarketMap, server: string): Promise<{ [asset: string]: bigInt.BigInteger }> {
        let balances = {};

        await Promise.all(Object.keys(markets).map(async (asset) => {
            switch (assetTypeToStandard(asset as AssetType)) {
                case TokenStandard.XTZ: // native asset
                    balances[asset] = await GetUnderlyingBalanceXTZ(address, server);
                    break;
                default: // contract-based assets
                    balances[asset] = await GetUnderlyingBalance(markets[asset].asset.underlying, address, server);
                    break;
            }
        }));
        return balances;
    }

    /*
     * @description
     *
     * @param
     */
    export async function GetUnderlyingBalanceXTZ(address: string, server: string): Promise<bigInt.BigInteger> {
        try {
            const balance = await TezosNodeReader.getSpendableBalanceForAccount(server, address);
            return bigInt(balance);
        } catch (e) {
            log.error(`Unable to read XTZ balance for ${address}\n${e}`);
            return bigInt(-1); // TODO: should default return values be undefined?
        }
    }

    /*
     * @description
     *
     * @param asset
     * @param markets Map of protocol markets
     * @param address Account address
     * @param server Tezos node
     */
    export async function GetUnderlyingBalance(underlying: UnderlyingAsset, address: string, server: string): Promise<bigInt.BigInteger> {
        if (underlying.balancesMapId === undefined) { // need to get balancesMapId from underlying asset contract's storage
            try {
                const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(address, 'address'), 'hex'));
                const mapResult = await TezosNodeReader.getValueForBigMapKey(server, underlying.balancesMapId!, packedKey);
                underlying.balancesMapId = JSONPath({ path: underlying.balancesPath!, json: mapResult });
            } catch (e) {
                log.error(`Unable to read contract storage for FA12 fToken ${underlying.address!}\n${e}`);
                throw e;
            }
        }
        try {
            const packedKey = TezosMessageUtils.encodeBigMapKey(Buffer.from(TezosMessageUtils.writePackedData(address, 'address'), 'hex'));
            const mapResult = await TezosNodeReader.getValueForBigMapKey(server, underlying.balancesMapId!, packedKey);
            const balance = JSONPath({ path: underlying.balancesPath!, json: mapResult });
            return bigInt(balance);
        } catch (e) {
            log.error(`Unable to read balance from storage for underlying asset at ${underlying.address!}\n${e}`);
            throw e;
        }
    }

    /*
     * @description Returns the ratio of loans to collateral in terms of basis points.
     *
     * @param
     */
    export function calculateHealth(collateral: bigInt.BigInteger, loans: bigInt.BigInteger): number {
        return 1000;

        // if (collateral.eq(0))
        //     return Number.POSITIVE_INFINITY;
        // else
        //     return loans.divide(collateral).multiply(10000).toJSNumber();
    }

    /*
     * @description
     *
     * @param
     */
    export function calculateAccountRate(totalCollateralUsd: bigInt.BigInteger, balances: FToken.BalanceMap, markets: MarketMap): number {
        let rate = 1;
        for (const asset in balances) {
            // rate += ( asset supply rate ) * ( (asset supply balance) / totalCollateralUsd )
            if (balances[asset].collateral!)
                // TODO: fractions
                // rate += FToken.GetSupplyRate(markets[asset].storage) * (balances[asset].supplyBalanceUsd! / totalCollateralUsd);
                rate += 0;
        }
        return rate;
    }

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
    export function supplyComposition(account: Account): SupplyComposition {
        let assets: { assetType: AssetType, usdValue: bigInt.BigInteger }[] = [];
        let collateral = bigInt(0);
        let totalUsdValue = bigInt(0);
        for (const asset in account.marketBalances) {
            const balance = account.marketBalances[asset].supplyBalanceUsd!;
            if (balance.geq(bigInt(0)))
                assets.push({ assetType: asset as AssetType, usdValue: balance });
            if (account.marketBalances[asset].collateral!)
                collateral = collateral.add(balance);
            totalUsdValue = totalUsdValue.add(balance);
        }
        return {
            assets: assets,
            collateral: collateral,
            totalUsdValue: totalUsdValue
        }
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
    export function borrowComposition(account: Account): BorrowComposition {
        let assets: { assetType: AssetType, usdValue: bigInt.BigInteger }[] = [];
        let borrowLimit = bigInt(0);
        let totalUsdValue = bigInt(0);
        for (const asset in account.marketBalances) {
            const balance = account.marketBalances[asset].loanBalanceUsd!;
            if (balance.geq(bigInt(0)))
                assets.push({ assetType: asset as AssetType, usdValue: balance });
            // TODO: fix
            if (account.marketBalances[asset].collateral!)
                borrowLimit = borrowLimit.add(balance);
            totalUsdValue = totalUsdValue.add(balance);
        }
        return {
            assets: assets,
            borrowLimit: borrowLimit,
            totalUsdValue: totalUsdValue
        }
    }

    /*
     * @description
     *
     * @param
     */
    export interface SupplyMarket {
        rate: number;
        balanceUnderlying: bigInt.BigInteger;
        balanceUsd: bigInt.BigInteger;
        collateral: boolean;
    }

    /*
     * @description Helper function for SupplyMarket
     *
     * @param
     */
    function parseSupplyMarkets(balances: FToken.BalanceMap | undefined, markets: MarketMap, compare: (bi: bigInt.BigInteger) => boolean): { [assetType: string]: SupplyMarket } {
        // if undefined balances passed in (no account), get values for all assets
        let assets: AssetType[] = [];
        if (balances !== undefined) {
            assets = Object.keys(balances).map((a) => a as AssetType);
        } else {
            assets = Object.keys(markets).map((a) => a as AssetType);
        }

        // aggregate supply market data
        const suppliedMarkets: { [assetType: string]: SupplyMarket } = {};
        for (const asset of assets) {
            // use balances for account
            if (balances !== undefined && balances[asset] !== undefined && compare(balances[asset].supplyBalanceUnderlying)) {
                suppliedMarkets[asset] = {
                    rate: markets[asset].supply.rate,
                    balanceUnderlying: balances[asset].supplyBalanceUnderlying,
                    balanceUsd: balances[asset].supplyBalanceUsd!,
                    collateral: balances[asset].collateral!
                };
            } else { // set balances to 0 for no account
                // TODO: what values to display when no account connected?
                suppliedMarkets[asset] = {
                    rate: markets[asset].supply.rate,
                    balanceUnderlying: bigInt(0),
                    balanceUsd: bigInt(0),
                    collateral: false
                };
            }
        }
        return suppliedMarkets;
    }

    /*
     * @description Returns map of supply side info for markets in which account has supplied funds.
     *
     * @param
     */
    export function getSuppliedMarkets(account: Account, markets: MarketMap): { [assetType: string]: SupplyMarket } {
        return parseSupplyMarkets(account.marketBalances, markets, (bi: bigInt.BigInteger) => { return bi.geq(bigInt(0)) });
    }

    /*
     * @description Returns map of supply side info for markets in which account has *not* supplied funds. If passed no account
     *
     * @param
     */
    export function getUnsuppliedMarkets(account: Account | undefined, markets: MarketMap): { [assetType: string]: SupplyMarket } {
        return parseSupplyMarkets(account?.marketBalances, markets, (bi: bigInt.BigInteger) => { return bi.eq(bigInt(0)); });
        // const unsuppliedMarkets: { [assetType: string]: SupplyMarket } = {};
        // for (const asset in account.marketBalances) {
        //     const balance = account.marketBalances[asset];
        //     if (balance.supplyBalanceUnderlying.eq(bigInt(0))) {
        //         unsuppliedMarkets[asset] = {
        //             rate: markets[asset].supply.rate,
        //             balanceUnderlying: balance.supplyBalanceUnderlying,
        //             balanceUsd: balance.supplyBalanceUsd!,
        //             collateral: balance.collateral!
        //         };
        //     }
        // }
        // return unsuppliedMarkets;
    }

    /*
     * @description
     *
     * @param
     */
    export interface BorrowMarket {
        rate: number;
        balanceUnderlying: bigInt.BigInteger;
        balanceUsd: bigInt.BigInteger;
        liquidityUnderlying: bigInt.BigInteger;
        liquidityUsd: bigInt.BigInteger;
    }

    /*
     * @description Helper function for BorrowMarket
     *
     * @param
     */
    function parseBorrowMarkets(balances: FToken.BalanceMap | undefined, markets: MarketMap, compare: (bi: bigInt.BigInteger) => boolean): { [assetType: string]: BorrowMarket } {
        // if undefined balances passed in (no account), get values for all assets
        let assets: AssetType[] = [];
        if (balances !== undefined)
            assets = Object.keys(balances).map((a) => a as AssetType);
        else
            assets = Object.keys(markets).map((a) => a as AssetType);

        // aggregate supply market data
        const borrowedMarkets: { [assetType: string]: BorrowMarket } = {};
        for (const asset of assets) {
            // use balances for account
            if (balances !== undefined && balances[asset] !== undefined && compare(balances[asset].loanBalanceUnderlying)) {
                borrowedMarkets[asset] = {
                    rate: markets[asset].borrow.rate,
                    balanceUnderlying: balances[asset].loanBalanceUnderlying,
                    balanceUsd: balances[asset].loanBalanceUsd!,
                    liquidityUnderlying: markets[asset].cash,
                    liquidityUsd: markets[asset].cashUsd
                };
            } else { // set balances to 0 for no account
                // TODO: what values to display when no account connected?
                borrowedMarkets[asset] = {
                    rate: markets[asset].borrow.rate,
                    balanceUnderlying: bigInt(0),
                    balanceUsd: bigInt(0),
                    liquidityUnderlying: markets[asset].cash,
                    liquidityUsd: markets[asset].cashUsd
                };
            }
        }
        return borrowedMarkets;
    }

    /*
     * @description Returns map of borrow side info for markets in which account has borrowed funds.
     *
     * @param
     */
    export function getBorrowedMarkets(account: Account, markets: MarketMap): { [assetType: string]: BorrowMarket } {
        return parseBorrowMarkets(account.marketBalances, markets, (bi: bigInt.BigInteger) => { return bi.geq(bigInt(0)); });
    }

    /*
     * @description Returns map of borrow sides for markets in which user has not borrowed funds.
     *
     * @param
     */
    export function getUnborrowedMarkets(account: Account | undefined, markets: MarketMap): { [assetType: string]: BorrowMarket } {
        return parseBorrowMarkets(account?.marketBalances, markets, (bi: bigInt.BigInteger) => { return bi.eq(0); });
        // const unborrowedMarkets: { [assetType: string]: BorrowMarket } = {};
        // for (const asset in account.marketBalances) {
        //     const balance = account.marketBalances[asset];
        //     if (balance.loanBalanceUnderlying.eq(bigInt(0)))
        //         unborrowedMarkets[asset] = {
        //             rate: markets[asset].borrow.rate,
        //             balanceUnderlying: balance.loanBalanceUnderlying,
        //             balanceUsd: balance.loanBalanceUsd!,
        //             liquidityUnderlying: markets[asset].cash,
        //             liquidityUsd: markets[asset].cashUsd
        //         };
        // }
        // return unborrowedMarkets;
    }

    /*
     * @description Information to display for Supply, Withdraw, and Collateralize/Uncollateralize modals
     *
     * @param rate Current rate paid to suppliers. Undefined for Collateralize/Uncollateralize.
     * @param borrowLimit Current borrow limit
     * @param borrowLimitUsed Percentage of account's borrow limit currently used
     */
    export interface SupplyMarketModal {
        rate?: number;
        borrowLimitUsd: bigInt.BigInteger;
        borrowLimitUsed: number
    }

    /*
     * @description
     *
     * @param
     */
    export function getSupplyMarketModal(account: Account, market: Market): SupplyMarketModal {
        return {
            rate: market.supply.rate,
            borrowLimitUsd: account.totalCollateralUsd.multiply(bigInt(account.health)), // TODO
            borrowLimitUsed: account.health
        } as SupplyMarketModal;
    }

    /*
     * @description Information to display for Borrow, RepayBorrow modals
     *
     * @param rate Current rate paid by borrowers
     * @param borrowBalance Current USD amount borrowed
     * @param borrowLimitUsed Percentage of account's bhorrow limit currently used
     */
    export interface BorrowMarketModal {
        rate: number;
        borrowBalanceUsd: bigInt.BigInteger;
        borrowLimitUsed: number
    }

    /*
     * @description
     *
     * @param
     */
    export function getBorrowMarketModal(account: Account, market: Market): BorrowMarketModal {
        return {
            rate: market.borrow.rate,
            borrowBalanceUsd: account.totalLoanUsd,
            borrowLimitUsed: account.health
        } as BorrowMarketModal;
    }

    /*
     * Return the required operations for adding permissions to the underlying asset contracts. Approves the amount in params for FA1.2 and adds keystore.publicKeyHash as operator for FA2.
     *
     * @param params The parameters for invoking the CToken entrypoint
     * @param cancelPermission True when removing permissions
     * @param counter Current accout counter
     * @param keystore
     * @param fee
     * @param gas
     * @param freight
     */
    export function permissionOperation(params: FToken.MintPair | FToken.RepayBorrowPair, cancelPermission: boolean, protocolAddresses: ProtocolAddresses, counter: number, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction | undefined {
        const underlying: UnderlyingAsset = protocolAddresses.underlying[params.underlying] == undefined
            ? { assetType: AssetType.XTZ }
            : protocolAddresses.underlying[params.underlying];
        switch (assetTypeToStandard(underlying.assetType)) {
            case TokenStandard.FA12:
                // fa12 approval operation
                return cancelPermission ?
                    // fa12 approved balance is depleted, so no need to invoke again to cancel
                    undefined :
                    // fa12 approve balance
                    Tzip7ReferenceTokenHelper.ApproveBalanceOperation(params.amount, protocolAddresses.fTokens[params.underlying], counter, underlying.address!, pkh, 0, gas, freight);
            case TokenStandard.FA2:
                const updateOperator: UpdateOperator = {
                    owner: pkh,
                    operator: protocolAddresses.fTokens[params.underlying],
                    tokenid: underlying.tokenId!
                };
                return cancelPermission ?
                    // fa2 remove operator
                    MultiAssetTokenHelper.RemoveOperatorsOperation(underlying.address!, counter, pkh, 0, [updateOperator]) :
                    // fa2 add operator
                    MultiAssetTokenHelper.AddOperatorsOperation(underlying.address!, counter, pkh, 0, [updateOperator]);
            case TokenStandard.XTZ:
                return undefined;
        }
    }

    /*
     * Construct the operation group for minting fTokens.
     *
     * @param
     */
    export function MintOpGroup(mint: FToken.MintPair, protocolAddresses: ProtocolAddresses, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOpGroup([mint.underlying], protocolAddresses, 0, pkh, gas, freight));
        // get permissions from underlying asset
        let permissionOp = permissionOperation(mint, false, protocolAddresses, 0, pkh);
        if (permissionOp != undefined)
            ops.push(permissionOp);
        // mint operation
        ops.push(FToken.MintOperation(mint, 0, protocolAddresses.fTokens[mint.underlying], pkh, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(mint, true, protocolAddresses, 0, pkh);
        if (removePermissionOp != undefined)
            ops.push(removePermissionOp);
        return ops;
    }

    /*
     * Construct and invoke the operation group for minting fTokens (supplying underlying).
     *
     * @param
     */
    export async function Mint(mint: FToken.MintPair, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const ops: Transaction[] = MintOpGroup(mint, protocolAddresses, keystore.publicKeyHash, gas, freight);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct the operation group for redeeming fTokens for the underlying asset.
     *
     * @param
     */
    export function RedeemOpGroup(redeem: FToken.RedeemPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        if (!collaterals.includes(redeem.underlying)) // need to accrueInterest on the redeemed market as well)
            collaterals.push(redeem.underlying);
        ops = ops.concat(FToken.AccrueInterestOpGroup(collaterals, protocolAddresses, 0, pkh, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOpGroup(collaterals, protocolAddresses, 0, pkh));
        // redeem operation
        ops.push(FToken.RedeemOperation(redeem, 0, protocolAddresses.fTokens[redeem.underlying], pkh, gas, freight));
        return ops;
    }

    /*
     * Construct and invoke the operation group for redeeming fTokens for the underlying asset.
     *
     * @param
     */
    export async function Redeem(redeem: FToken.RedeemPair, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        const ops: Transaction[] = RedeemOpGroup(redeem, collaterals, protocolAddresses, keystore.publicKeyHash);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct the operation group for borrowing underlying assets.
     *
     * @param
     */
    export function BorrowOpGroup(borrow: FToken.BorrowPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        if (!collaterals.includes(borrow.underlying)) // need to accrueInterest on the borrowed market as well
            collaterals.push(borrow.underlying);
        ops = ops.concat(FToken.AccrueInterestOpGroup(collaterals, protocolAddresses, 0, pkh, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOpGroup(collaterals, protocolAddresses, 0, pkh));
        // borrow operation
        ops.push(FToken.BorrowOperation(borrow, 0, protocolAddresses.fTokens[borrow.underlying], pkh, gas, freight));
        return ops;
    }

    /*
     * Construct and invoke the operation group for borrowing underlying assets.
     *
     * @param
     */
    export async function Borrow(borrow: FToken.BorrowPair, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        const ops: Transaction[] = BorrowOpGroup(borrow, collaterals, protocolAddresses, keystore.publicKeyHash);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct the operation group for repaying borrowed fTokens.
     *
     * @param
     */
    export function RepayBorrowOpGroup(repayBorrow: FToken.RepayBorrowPair, protocolAddresses: ProtocolAddresses, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOpGroup([repayBorrow.underlying], protocolAddresses, 0, pkh, gas, freight));
        // get permissions from underlying asset
        let permissionOp = permissionOperation(repayBorrow, false, protocolAddresses, 0, pkh);
        if (permissionOp != undefined)
            ops.push(permissionOp);
        // repayBorrow operation
        ops.push(FToken.RepayBorrowOperation(repayBorrow, 0, protocolAddresses.fTokens[repayBorrow.underlying], pkh, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(repayBorrow, true, protocolAddresses, 0, pkh);
        if (removePermissionOp != undefined)
            ops.push(removePermissionOp);
        return ops;
    }

    /*
     * Construct and invoke the operation group for repaying borrowed fTokens.
     *
     * @param
     */
    export async function RepayBorrow(repayBorrow: FToken.RepayBorrowPair, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const ops: Transaction[] = RepayBorrowOpGroup(repayBorrow, protocolAddresses, keystore.publicKeyHash, gas, freight);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * @description
     *
     * @param
     */
    export function EnterMarketsOpGroup(enterMarkets: Comptroller.EnterMarketsPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOpGroup(collaterals, protocolAddresses, 0, pkh, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOpGroup(collaterals, protocolAddresses, 0, pkh));
        // enterMarkets operation
        ops.push(Comptroller.EnterMarketsOperation(enterMarkets, protocolAddresses.comptroller, 0, pkh, gas, freight));
        return ops;
    }

    /*
     * @description
     *
     * @param
     */
    export async function EnterMarkets(enterMarkets: Comptroller.EnterMarketsPair, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        const ops: Transaction[] = EnterMarketsOpGroup(enterMarkets, collaterals, protocolAddresses, keystore.publicKeyHash, fee);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * @description
     *
     * @param
     */
    export function ExitMarketOpGroup(exitMarket: Comptroller.ExitMarketPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, pkh: string, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOpGroup(collaterals, protocolAddresses, 0, pkh, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOpGroup(collaterals, protocolAddresses, 0, pkh));
        // enterMarkets operation
        ops.push(Comptroller.ExitMarketOperation(exitMarket, protocolAddresses.comptroller, 0, pkh, gas, freight));
        return ops;
    }

    /*
     * @description
     *
     * @param
     */
    export async function ExitMarket(exitMarket: Comptroller.ExitMarketPair, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000) {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        const ops: Transaction[] = ExitMarketOpGroup(exitMarket, collaterals, protocolAddresses, keystore.publicKeyHash, gas, freight);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }
}
