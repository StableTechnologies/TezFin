import {
    Account,
    BorrowComposition,
    BorrowMarket,
    BorrowMarketModal,
    Market,
    MarketData,
    MarketMap,
    ProtocolAddresses,
    SupplyComposition,
    SupplyMarket,
    SupplyMarketModal,
    UnderlyingAsset,
    UnderlyingAssetMetadata,
} from './types';
import { AssetType, TokenStandard } from './enum';
import {
    Delegation,
    KeyStore,
    MultiAssetTokenHelper,
    registerFetch,
    registerLogger,
    Reveal,
    Signer,
    TezosContractUtils,
    TezosLanguageUtil,
    TezosMessageUtils,
    TezosNodeReader,
    TezosNodeWriter,
    TezosParameterFormat,
    Transaction,
    Tzip7ReferenceTokenHelper,
    UpdateOperator,
} from 'conseiljs';

import { Comptroller } from './Comptroller';
import { FToken } from './FToken';
import { InterestRateModel } from './contracts/InterestRateModel';
import { JSONPath } from 'jsonpath-plus';
import { PriceFeed } from './PriceFeed';
import bigInt from 'big-integer';
import { tokenNames } from './const';
import log, { LogLevelDesc } from 'loglevel';
import fetch from 'node-fetch';
import { BigNumber } from 'bignumber.js';
import { ParamsWithKind, PreparedOperation, TezosToolkit, Signer as TaquitSigner } from '@taquito/taquito';
import {Parser} from '@taquito/michel-codec';
import { OperationContents, OpKind, TransactionOperationParameter } from '@taquito/rpc';
import { e } from 'mathjs';

export namespace TezosLendingPlatform {
    /*
     * @description TODO: convert mantissa to number
     *
     * @param
     */
    export function ConvertFromMantissa(mantissa: bigInt.BigInteger): bigInt.BigInteger {
        return bigInt(mantissa);
    }

    export function initConseil(logLevel: LogLevelDesc) {
        const logger = log.getLogger('conseiljs');
        logger.setLevel(logLevel as LogLevelDesc, false);
        registerLogger(logger);
        registerFetch(fetch);
    }

    /*
     * @description Converts an fToken contract's storage to Market object
     *
     * @param fToken The fToken contract's storage
     */
    export function MakeMarket(
        fToken: FToken.Storage,
        comptroller: Comptroller.Storage,
        address: string,
        underlying: UnderlyingAsset,
        rateModel: InterestRateModel.Storage,
        price: bigInt.BigInteger,
        level: number,
    ): Market {
        const asset: UnderlyingAssetMetadata = {
            name: tokenNames[underlying.assetType],
            underlying: underlying,
            administrator: fToken.administrator,
            price: comptroller.markets[underlying.assetType].price,
        };
        const supply: MarketData = {
            // numParticipants: fToken.supply.numSuppliers?,
            numParticipants: 0,
            totalAmount: fToken.supply.totalSupply,
            rate: FToken.getSupplyRateApy(fToken, rateModel),
            // TODO: :  create a  dynamic supply rate apy function
            rateFn: (additionalAmount: bigInt.BigInteger) => {
                return FToken.getSupplyRateApy(fToken, rateModel);
            },
        };
        const borrow: MarketData = {
            // numParticipants: fToken.borrow.numBorrowers,
            numParticipants: 0,
            totalAmount: fToken.borrow.totalBorrows,
            rate: FToken.getBorrowRateApy(fToken, rateModel),
            rateFn: FToken.getDynamicBorrowRateApyFn(fToken, rateModel),
        };
	const available =  FToken.applyExchangeRate(
                        supply.totalAmount.minus(borrow.totalAmount).minus(fToken.totalReserves),
		fToken);
	    
        return {
            currentPrice: price,
            address: address,
            asset: asset,
            cash: FToken.GetCash(fToken),
            cashUsd: comptroller.markets[underlying.assetType].price.multiply(FToken.GetCash(fToken)),
            supply: supply,
            borrow: borrow,
	    available: available,
            dailyInterestPaid: bigInt('0'), // TODO: parse this
            reserves: fToken.totalReserves,
            reserveFactor: fToken.reserveFactorMantissa.toJSNumber(),
            collateralFactor: comptroller.markets[underlying.assetType].collateralFactor,
            exchangeRate: FToken.getExchangeRate(fToken),
            storage: fToken,
            rateModel: rateModel,
            level: level,
        } as Market;
    }

    /*
     * @description Gets the market data for all markets in protocolAddresses
     *
     * @param address The fToken contract address to query
     * @param server Tezos node URL
     */
    export async function GetMarkets(
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
    ): Promise<MarketMap> {
        // get storage for all contracts
        let markets: MarketMap = {};
        const head = await TezosNodeReader.getBlockHead(server);
        await Promise.all(
            Object.keys(protocolAddresses.fTokens).map(async (asset) => {
                const fTokenAddress = protocolAddresses.fTokens[asset];
                const fTokenType =
                    protocolAddresses.underlying[protocolAddresses.fTokensReverse[fTokenAddress]].tokenStandard;
                try {
                    const fTokenStorage: FToken.Storage = await FToken.GetStorage(
                        fTokenAddress,
                        protocolAddresses.underlying[protocolAddresses.fTokensReverse[fTokenAddress]],
                        server,
                        fTokenType,
                    );
                    const rateModel = await InterestRateModel.GetStorage(
                        server,
                        protocolAddresses.interestRateModel[asset],
                    );
                    const oraclePrice = await PriceFeed.GetPrice(
                        protocolAddresses.fTokensReverse[fTokenAddress],
                        protocolAddresses.oracle,
                        head.header.level,
                        server,
                    );

                    const borrowRate = FToken.getBorrowRate(fTokenStorage, rateModel);
                    const fTokenStorageAfterAccrual = FToken.SimulateAccrueInterest(
                        borrowRate,
                        head.header.level + 5, // Simulates AccrueInterest 5 blocks in the future
                        fTokenStorage,
                    );
                    markets[asset] = MakeMarket(
                        fTokenStorageAfterAccrual,
                        comptroller,
                        fTokenAddress,
                        protocolAddresses.underlying[asset],
                        rateModel,
                        oraclePrice,
                        head.header.level,
                    );
                } catch (e) {
                    log.error(
                        `Failed in GetMarkets for ${asset} at ${protocolAddresses.fTokens[asset]} and ${JSON.stringify(
                            protocolAddresses.underlying[asset],
                        )} with ${e}`,
                    );
                    log.error(`Comptroller state: ${JSON.stringify(comptroller)}`);
                }
            }),
        );
        return markets;
    }

    /*
     * @description Returns the account corresponding to address.
     *
     * @param address Address of the requested account
     * @param markets List of fToken markets
     * @param comptroller Comptroller storage
     * @param protocolAddresses
     * @param server Tezos node
     */
    export async function GetAccount(
        address: string,
        markets: MarketMap,
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
    ): Promise<Account> {
        // check which markets are collaterals
        const collaterals = await Comptroller.GetCollaterals(address, comptroller, protocolAddresses, server);
        // get balance in each underlying
        const underlyingBalances = await GetUnderlyingBalances(address, markets, server);
        // get balance in each market
        const marketBalances = await GetFtokenBalances(address, markets, server);
        console.log('markets', marketBalances);
        console.log('collaterals', collaterals);
        // get prices from oracle
        // calculate usd balances and collaterals
        for (const asset in marketBalances) {
            const scale = bigInt(10).pow(protocolAddresses.underlying[asset].decimals);
            marketBalances[asset].supplyBalanceUsd = comptroller.markets[asset].price
                .multiply(marketBalances[asset].supplyBalanceUnderlying)
                .divide(scale);
            marketBalances[asset].loanBalanceUsd = comptroller.markets[asset].price
                .multiply(marketBalances[asset].loanBalanceUnderlying)
                .divide(scale);
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
            rate: rate,
        } as Account;
    }

    /*
     * @description
     *
     * @param
     */
    export async function GetFtokenBalances(
        address: string,
        markets: MarketMap,
        server: string,
    ): Promise<FToken.BalanceMap> {
        let balances: FToken.BalanceMap = {};
        await Promise.all(
            Object.keys(markets).map(async (asset) => {
                console.log('cc1', asset, markets[asset]);
                balances[asset] = await FToken.GetBalance(
                    address,
                    asset as AssetType,
                    markets[asset].storage.borrow.borrowIndex,
                    markets[asset].storage.balancesMapId,
                    server,
                );
                console.log('cc2', asset, balances[asset]);
            }),
        );
        return balances;
    }

    /**
     * @description Provides the underlying balance per asset class after the
     *  application of the exchange rate for an address
     *
     * @param markets Map of protocol markets
     * @param address Account address
     * @param server Tezos node
     * @returns underlyingBalances as a map of asset -> underlyingBalance
     */
    export async function GetUnderlyingBalances(
        address: string,
        markets: MarketMap,
        server: string,
    ): Promise<{ [asset: string]: BigNumber }> {
        let balances = {};

        await Promise.all(
            Object.keys(markets).map(async (asset) => {
                switch (markets[asset].asset.underlying.tokenStandard) {
                    case TokenStandard.XTZ: // native asset
                        balances[asset] = await GetUnderlyingBalanceXTZ(address, server);
                        break;
                    default: // contract-based assets
                        balances[asset] = await GetUnderlyingBalanceToken(
                            markets[asset].asset.underlying,
                            address,
                            server,
                        );
                        break;
                }
            }),
        );
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

    // Only valid for specific tokens
    export async function PopulateTokenBalanceMapIDs(
        underlying: { [assetType: string]: UnderlyingAsset },
        server: string,
    ) {
        Object.keys(underlying).forEach(async (asset) => {
            if (underlying[asset].tokenStandard === TokenStandard.XTZ) return;
            const storage = await TezosNodeReader.getContractStorage(server, underlying[asset].address!);
            if (underlying[asset].tokenStandard === TokenStandard.FA12) {
                underlying[asset].balancesMapId = Number(JSONPath({ path: '$.args[0].args[1].int', json: storage })[0]);
            } else if (underlying[asset].tokenStandard === TokenStandard.FA2) {
                underlying[asset].balancesMapId = Number(JSONPath({ path: '$.args[0].args[1].int', json: storage })[0]);
            }
        });
        return underlying;
    }

    /*
     * @description
     *
     * @param asset
     * @param markets Map of protocol markets
     * @param address Account address
     * @param server Tezos node
     */
    export async function GetUnderlyingBalanceToken(
        underlying: UnderlyingAsset,
        address: string,
        server: string,
    ): Promise<bigInt.BigInteger> {
        if (underlying.balancesMapId === undefined) {
            // need to get balancesMapId from underlying asset contract's storage
            try {
                log.info(`Getting balances map id from storage for ${underlying.assetType} at ${address}`);
                const storage = await TezosNodeReader.getContractStorage(server, underlying.address!);
                if (underlying.tokenStandard === TokenStandard.FA12) {
                    // TODO: this is not a good heuristic
                    underlying.balancesMapId = Number(JSONPath({ path: '$.args[0].int', json: storage })[0]);
                } else if (underlying.tokenStandard === TokenStandard.FA2) {
                    underlying.balancesMapId = Number(JSONPath({ path: '$.args[0].args[1].int', json: storage })[0]);
                }
            } catch (e) {
                log.error(
                    `Unable to read contract storage for ${underlying.assetType} at ${underlying.address!}\n${e}`,
                );
                throw e;
            }
        }
        try {
            let packedKey = TezosMessageUtils.encodeBigMapKey(
                Buffer.from(TezosMessageUtils.writePackedData(address, 'address'), 'hex'),
            );
            if (underlying.tokenStandard === TokenStandard.FA2) {
                const accountHex = `0x${TezosMessageUtils.writeAddress(address)}`;
                packedKey = TezosMessageUtils.encodeBigMapKey(
                    Buffer.from(
                        TezosMessageUtils.writePackedData(
                            `(Pair ${accountHex} ${underlying.tokenId})`,
                            '',
                            TezosParameterFormat.Michelson,
                        ),
                        'hex',
                    ),
                );
            }
            // mainnet tzBTC contract needs special handling
            if (underlying.assetType === AssetType.TZBTC && underlying.balancesMapId === 31) {
               const accountHex = `0x${TezosMessageUtils.writeAddress(address)}`;
               packedKey = TezosMessageUtils.encodeBigMapKey(
                 Buffer.from(TezosMessageUtils.writePackedData(
                    TezosMessageUtils.writePackedData(
                    `( Pair "ledger" ${accountHex} )`,
                    "",
                    TezosParameterFormat.Michelson
                  ), "bytes"), "hex")
               );
            }
            
            const mapResult = await TezosNodeReader.getValueForBigMapKey(server, underlying.balancesMapId!, packedKey);
            
            // mainnet tzBTC contract needs special handling
            if (underlying.assetType === AssetType.TZBTC && underlying.balancesMapId === 31) {
                const result = TezosMessageUtils.readPackedData(
                  mapResult.bytes.toString(),
                  "michelson"
                ).toString()
               const regex = result.match(/^\(Pair ([0-9]*) \[(.*)\]\)/);
               if (regex === null || regex[1] === "" || regex[1] == undefined) {
                 return bigInt(0);
               }
               return bigInt(regex[1]);
            }
            const balance = JSONPath({ path: underlying.balancesPath!, json: mapResult })[0];
        
            return bigInt(balance);
        } catch (e) {
            log.error(
                `Unable to read balance from storage for underlying ${
                    underlying.assetType
                } at ${underlying.address!}\n${e}`,
            );
            return bigInt(0);
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
    export function calculateAccountRate(
        totalCollateralUsd: bigInt.BigInteger,
        balances: FToken.BalanceMap,
        markets: MarketMap,
    ): number {
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
    export function supplyComposition(account: Account): SupplyComposition {
        let assets: { assetType: AssetType; usdValue: bigInt.BigInteger }[] = [];
        let collateral = bigInt(0);
        let totalUsdValue = bigInt(0);
        for (const asset in account.marketBalances) {
            const balance = account.marketBalances[asset].supplyBalanceUsd!;
            if (balance.geq(bigInt(0))) assets.push({ assetType: asset as AssetType, usdValue: balance });
            if (account.marketBalances[asset].collateral!) collateral = collateral.add(balance);
            totalUsdValue = totalUsdValue.add(balance);
        }
        return {
            assets: assets,
            collateral: collateral,
            totalUsdValue: totalUsdValue,
        };
    }

    /*
     * @description
     *
     * @param
     */
    export function borrowComposition(account: Account): BorrowComposition {
        let assets: { assetType: AssetType; usdValue: bigInt.BigInteger }[] = [];
        let borrowLimit = bigInt(0);
        let totalUsdValue = bigInt(0);
        for (const asset in account.marketBalances) {
            const balance = account.marketBalances[asset].loanBalanceUsd!;
            if (balance.geq(bigInt(0))) assets.push({ assetType: asset as AssetType, usdValue: balance });
            // TODO: fix
            if (account.marketBalances[asset].collateral!) borrowLimit = borrowLimit.add(balance);
            totalUsdValue = totalUsdValue.add(balance);
        }
        return {
            assets: assets,
            borrowLimit: borrowLimit,
            totalUsdValue: totalUsdValue,
        };
    }

    /*
     * @description Helper function for SupplyMarket
     *
     * @param
     */
    function parseSupplyMarkets(
        balances: FToken.BalanceMap | undefined,
        markets: MarketMap,
        compare: (bi: bigInt.BigInteger) => boolean,
    ): { [assetType: string]: SupplyMarket } {
        // if undefined balances passed in (no account), get values for all assets
        let assets: AssetType[] = [];
        if (balances !== undefined) {
            console.log('parseSupplyMarkets balances', balances);
            assets = Object.keys(balances).map((a) => a as AssetType);
        } else {
            console.log('parseSupplyMarkets markets', markets);
            assets = Object.keys(markets).map((a) => a as AssetType);
        }

        // aggregate supply market data
        const suppliedMarkets: { [assetType: string]: SupplyMarket } = {};
        for (const asset of assets) {
            // use balances for account
            if (
                balances !== undefined &&
                balances[asset] !== undefined &&
                compare(balances[asset].supplyBalanceUnderlying)
            ) {
                suppliedMarkets[asset] = {
                    rate: markets[asset].supply.rate,
                    balance: balances[asset].supplyBalanceUnderlying,
                    balanceUnderlying: FToken.applyExchangeRate(
                        balances[asset].supplyBalanceUnderlying,
                        markets[asset].storage,
                    ),
                    balanceUsd: balances[asset].supplyBalanceUsd!,
                    collateral: balances[asset].collateral!,
                };
                console.log('parseSupplyMarkets', asset, 'balances', suppliedMarkets[asset]);
            } else {
                // set balances to 0 for no account
                // TODO: what values to display when no account connected?
                suppliedMarkets[asset] = {
                    rate: markets[asset].supply.rate,
                    balance: bigInt(0),
                    balanceUnderlying: new BigNumber(0),
                    balanceUsd: bigInt(0),
                    collateral: false,
                };
                console.log('parseSupplyMarkets', asset, 'markets', suppliedMarkets[asset]);
            }
        }

        console.log('parseSupplyMarkets out', suppliedMarkets);
        return suppliedMarkets;
    }

    /*
     * @description Returns map of supply side info for markets in which account has supplied funds.
     *
     * @param
     */
    export function getSuppliedMarkets(account: Account, markets: MarketMap): { [assetType: string]: SupplyMarket } {
        console.log('getSuppliedMarkets in', account, markets);
        const r = parseSupplyMarkets(account.marketBalances, markets, (bi: bigInt.BigInteger) => bi.geq(bigInt(0)));
        console.log('getSuppliedMarkets out', r);

        return r;
    }

    /*
     * @description Returns map of supply side info for markets in which account has *not* supplied funds. If passed no account
     *
     * @param
     */
    export function getUnsuppliedMarkets(
        account: Account | undefined,
        markets: MarketMap,
    ): { [assetType: string]: SupplyMarket } {
        console.log('getUnsuppliedMarkets in', account, markets);
        const r = parseSupplyMarkets(account?.marketBalances, markets, (bi: bigInt.BigInteger) => bi.eq(bigInt(0)));
        console.log('getUnsuppliedMarkets out', r);
        return r;
    }

    /*
     * @description Helper function for BorrowMarket
     *
     * @param
     */
    function parseBorrowMarkets(
        balances: FToken.BalanceMap | undefined,
        markets: MarketMap,
        compare: (bi: bigInt.BigInteger) => boolean,
    ): { [assetType: string]: BorrowMarket } {
        // if undefined balances passed in (no account), get values for all assets
        let assets: AssetType[] = [];
        if (balances !== undefined) assets = Object.keys(balances).map((a) => a as AssetType);
        else assets = Object.keys(markets).map((a) => a as AssetType);

        // aggregate supply market data
        const borrowedMarkets: { [assetType: string]: BorrowMarket } = {};
        for (const asset of assets) {
            // use balances for account
            if (
                balances !== undefined &&
                balances[asset] !== undefined &&
                compare(balances[asset].loanBalanceUnderlying)
            ) {
                borrowedMarkets[asset] = {
                    rate: markets[asset].borrow.rate,
                    balanceUnderlying: balances[asset].loanBalanceUnderlying,
                    balanceUsd: balances[asset].loanBalanceUsd!,
                    liquidityUnderlying: markets[asset].cash,
                    liquidityUsd: markets[asset].cashUsd,
                    outstandingLoan: FToken.getTotalBorrowRepayAmount(
                        balances[asset].loanPrincipal,
                        balances[asset].loanInterestIndex,
                        markets[asset].storage,
                    ),
                };
            } else {
                // set balances to 0 for no account
                // TODO: what values to display when no account connected?
                borrowedMarkets[asset] = {
                    rate: markets[asset].borrow.rate,
                    balanceUnderlying: bigInt(0),
                    balanceUsd: bigInt(0),
                    liquidityUnderlying: markets[asset].cash,
                    liquidityUsd: markets[asset].cashUsd,
                    outstandingLoan: bigInt(0),
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
        return parseBorrowMarkets(account.marketBalances, markets, (bi: bigInt.BigInteger) => {
            return bi.geq(bigInt(0));
        });
    }

    /*
     * @description Returns map of borrow sides for markets in which user has not borrowed funds.
     *
     * @param
     */
    export function getUnborrowedMarkets(
        account: Account | undefined,
        markets: MarketMap,
    ): { [assetType: string]: BorrowMarket } {
        return parseBorrowMarkets(account?.marketBalances, markets, (bi: bigInt.BigInteger) => {
            return bi.eq(0);
        });
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
            borrowLimitUsed: account.health,
        } as SupplyMarketModal;
    }

    /*
     * @description
     *
     * @param
     */
    export function getBorrowMarketModal(account: Account, market: Market): BorrowMarketModal {
        return {
            rate: market.borrow.rate,
            borrowBalanceUsd: account.marketBalances[market.asset.name].loanBalanceUsd,
            borrowLimitUsed: account.health,
            borrowBalance: account.marketBalances[market.asset.name].loanBalanceUnderlying,
            underlying: market.asset.name,
            underlyingDecimals: market.asset.underlying.decimals,
        } as BorrowMarketModal;
    }

    /*
     * Return the required operations for adding permissions to the underlying asset contracts. Approves the amount in params for FA1.2 and adds keystore.publicKeyHash as operator for FA2.
     *
     * @param params The parameters for invoking the CToken entrypoint
     * @param cancelPermission True when removing permissions
     * @param counter Current account counter
     * @param keystore
     * @param fee
     * @param gas
     * @param freight
     */
    export function permissionOperation(
        asset: AssetType,
        amount: number,
        cancelPermission: boolean,
        protocolAddresses: ProtocolAddresses,
        counter: number,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] | undefined {
        const underlying: UnderlyingAsset =
            protocolAddresses.underlying[asset] == undefined
                ? { assetType: AssetType.XTZ, tokenStandard: TokenStandard.XTZ, decimals: 6 }
                : protocolAddresses.underlying[asset];
        switch (underlying.tokenStandard) {
            case TokenStandard.FA12:
                // fa12 approval operation
                return cancelPermission
                    ? // fa12 approved balance is depleted, so no need to invoke again to cancel
                      undefined
                    : // fa12 approve balance
                      [
                          Tzip7ReferenceTokenHelper.ApproveBalanceOperation(
                              0,
                              protocolAddresses.fTokens[asset],
                              counter,
                              underlying.address!,
                              pkh,
                              0,
                              gas,
                              freight,
                          ),
                          Tzip7ReferenceTokenHelper.ApproveBalanceOperation(
                              amount,
                              protocolAddresses.fTokens[asset],
                              counter,
                              underlying.address!,
                              pkh,
                              0,
                              gas,
                              freight,
                          ),
                      ];
            case TokenStandard.FA2:
                const updateOperator: UpdateOperator = {
                    owner: pkh,
                    operator: protocolAddresses.fTokens[asset],
                    tokenid: underlying.tokenId!,
                };
                return cancelPermission
                    ? // fa2 remove operator
                      [
                          MultiAssetTokenHelper.RemoveOperatorsOperation(underlying.address!, counter, pkh, 0, [
                              updateOperator,
                          ]),
                      ]
                    : // fa2 add operator
                      [
                          MultiAssetTokenHelper.AddOperatorsOperation(underlying.address!, counter, pkh, 0, [
                              updateOperator,
                          ]),
                      ];
            case TokenStandard.XTZ:
                return undefined;
        }
    }

    /*
     * Construct the operation group for minting fTokens.
     *
     * @param
     */
    export function MintOpGroup(
        mint: FToken.MintPair,
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] {
        mint.underlying = mint.underlying.toUpperCase() as AssetType;
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(
            FToken.AccrueInterestOpGroup(
                Object.keys(protocolAddresses.fTokens) as AssetType[],
                protocolAddresses,
                0,
                pkh,
                gas,
                freight,
            ),
        );
        // get permissions from underlying asset
        let permissionOp = permissionOperation(mint.underlying, mint.amount, false, protocolAddresses, 0, pkh);
        if (permissionOp != undefined) ops.push(...permissionOp);
        // mint operation
        ops.push(FToken.MintOperation(mint, 0, protocolAddresses.fTokens[mint.underlying], pkh, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(mint.underlying, mint.amount, true, protocolAddresses, 0, pkh);
        if (removePermissionOp != undefined) ops.push(...removePermissionOp);
        return ops;
    }

    /*
     * Construct the operation group for liquidating fTokens.
     *
     * @param
     */
    export function LiquidateOpGroup(
        details: FToken.LiquidateDetails,
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] {
        details.supplyCollateral = details.supplyCollateral.toUpperCase() as AssetType;
        details.seizeCollateral = details.seizeCollateral.toUpperCase() as AssetType;
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(
            Comptroller.DataRelevanceOpGroup(
                Object.keys(protocolAddresses.fTokens) as AssetType[],
                protocolAddresses,
                0,
                pkh,
                details.borrower,
            ),
        );
        // get permissions from underlying asset
        let permissionOp = permissionOperation(
            details.supplyCollateral,
            details.amount,
            false,
            protocolAddresses,
            0,
            pkh,
        );
        if (permissionOp != undefined) ops.push(...permissionOp);
        // mint operation
        ops.push(FToken.LiquidateOperation(details, 0, protocolAddresses, pkh, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(
            details.supplyCollateral,
            details.amount,
            true,
            protocolAddresses,
            0,
            pkh,
        );
        if (removePermissionOp != undefined) ops.push(...removePermissionOp);
        return ops;
    }

    /*
     * Construct and invoke the operation group for minting fTokens (supplying underlying).
     *
     * @param
     */
    export async function Mint(
        mint: FToken.MintPair,
        protocolAddresses: ProtocolAddresses,
        server: string,
        signer: Signer,
        keystore: KeyStore,
        fee: number,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const ops: Transaction[] = MintOpGroup(mint, protocolAddresses, keystore.publicKeyHash, gas, freight);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct and invoke the operation group for minting fTokens (supplying underlying).
     *
     * @param
     */
    export async function Liquidate(
        details: FToken.LiquidateDetails,
        protocolAddresses: ProtocolAddresses,
        server: string,
        signer: Signer,
        keystore: KeyStore,
        fee: number,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const ops: Transaction[] = LiquidateOpGroup(details, protocolAddresses, keystore.publicKeyHash, gas, freight);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct the operation group for redeeming fTokens for the underlying asset.
     *
     * @param
     */
    export function RedeemOpGroup(
        redeem: FToken.RedeemPair,
        collaterals: AssetType[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] {
        let ops: Transaction[] = [];
        // comptroller data relevance
        ops = ops.concat(
            Comptroller.DataRelevanceOpGroup(
                Object.keys(protocolAddresses.fTokens) as AssetType[],
                protocolAddresses,
                0,
                pkh,
            ),
        );
        // redeem operation
        ops.push(FToken.RedeemOperation(redeem, 0, protocolAddresses.fTokens[redeem.underlying], pkh, gas, freight));
        return ops;
    }

    /*
     * Construct and invoke the operation group for redeeming fTokens for the underlying asset.
     *
     * @param
     */
    export async function Redeem(
        redeem: FToken.RedeemPair,
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
        signer: Signer,
        keystore: KeyStore,
        fee: number,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(
            keystore.publicKeyHash,
            comptroller,
            protocolAddresses,
            server,
        );
        const ops: Transaction[] = RedeemOpGroup(redeem, collaterals, protocolAddresses, keystore.publicKeyHash);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct the operation group for borrowing underlying assets.
     *
     * @param
     */
    export function BorrowOpGroup(
        borrow: FToken.BorrowPair,
        collaterals: AssetType[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] {
        let ops: Transaction[] = [];
        // comptroller data relevance
        ops = ops.concat(
            Comptroller.DataRelevanceOpGroup(
                Object.keys(protocolAddresses.fTokens) as AssetType[],
                protocolAddresses,
                0,
                pkh,
            ),
        );
        // borrow operation

        ops.push(FToken.BorrowOperation(borrow, 0, protocolAddresses.fTokens[borrow.underlying], pkh, gas, freight));

        return ops;
    }

    /*
     * Construct and invoke the operation group for borrowing underlying assets.
     *
     * @param
     */
    export async function Borrow(
        borrow: FToken.BorrowPair,
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
        signer: Signer,
        keystore: KeyStore,
    ): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(
            keystore.publicKeyHash,
            comptroller,
            protocolAddresses,
            server,
        );

        const ops: Transaction[] = BorrowOpGroup(borrow, collaterals, protocolAddresses, keystore.publicKeyHash);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);

        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct the operation group for repaying borrowed fTokens.
     *
     * @param
     */
    export function RepayBorrowOpGroup(
        repayBorrow: FToken.RepayBorrowPair,
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(
            FToken.AccrueInterestOpGroup(
                Object.keys(protocolAddresses.fTokens) as AssetType[],
                protocolAddresses,
                0,
                pkh,
                gas,
                freight,
            ),
        );
        // get permissions from underlying asset
        let permissionOp = permissionOperation(
            repayBorrow.underlying,
            repayBorrow.amount,
            false,
            protocolAddresses,
            0,
            pkh,
        );
        if (permissionOp != undefined) ops.push(...permissionOp);
        // repayBorrow operation
        ops.push(
            FToken.RepayBorrowOperation(
                repayBorrow,
                0,
                protocolAddresses.fTokens[repayBorrow.underlying],
                pkh,
                gas,
                freight,
            ),
        );
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(
            repayBorrow.underlying,
            repayBorrow.amount,
            true,
            protocolAddresses,
            0,
            pkh,
        );
        if (removePermissionOp != undefined) ops.push(...removePermissionOp);
        return ops;
    }

    /*
     * Construct and invoke the operation group for repaying borrowed fTokens.
     *
     * @param
     */
    export async function RepayBorrow(
        repayBorrow: FToken.RepayBorrowPair,
        protocolAddresses: ProtocolAddresses,
        server: string,
        signer: Signer,
        keystore: KeyStore,
        fee: number,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const ops: Transaction[] = RepayBorrowOpGroup(
            repayBorrow,
            protocolAddresses,
            keystore.publicKeyHash,
            gas,
            freight,
        );
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * @description
     *
     * @param
     */
    export function EnterMarketsOpGroup(
        enterMarkets: Comptroller.EnterMarketsPair,
        collaterals: AssetType[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] {
        let ops: Transaction[] = [];
        // comptroller data relevance
        ops = ops.concat(
            Comptroller.DataRelevanceOpGroup(
                Object.keys(protocolAddresses.fTokens) as AssetType[],
                protocolAddresses,
                0,
                pkh,
            ),
        );
        // enterMarkets operation
        ops.push(Comptroller.EnterMarketsOperation(enterMarkets, protocolAddresses.comptroller, 0, pkh, gas, freight));
        return ops;
    }

    /*
     * @description
     *
     * @param
     */
    export async function EnterMarkets(
        enterMarkets: Comptroller.EnterMarketsPair,
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
        signer: Signer,
        keystore: KeyStore,
        fee: number,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(
            keystore.publicKeyHash,
            comptroller,
            protocolAddresses,
            server,
        );
        const ops: Transaction[] = EnterMarketsOpGroup(
            enterMarkets,
            collaterals,
            protocolAddresses,
            keystore.publicKeyHash,
            fee,
        );
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * @description
     *
     * @param
     */
    export function ExitMarketOpGroup(
        exitMarket: Comptroller.ExitMarketPair,
        collaterals: AssetType[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        gas: number = 200_000,
        freight: number = 20_000,
    ): Transaction[] {
        let ops: Transaction[] = [];
        // comptroller data relevance
        ops = ops.concat(
            Comptroller.DataRelevanceOpGroup(
                Object.keys(protocolAddresses.fTokens) as AssetType[],
                protocolAddresses,
                0,
                pkh,
            ),
        );
        // enterMarkets operation
        ops.push(Comptroller.ExitMarketOperation(exitMarket, protocolAddresses.comptroller, 0, pkh, gas, freight));
        return ops;
    }

    /*
     * @description
     *
     * @param
     */
    export async function ExitMarket(
        exitMarket: Comptroller.ExitMarketPair,
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
        signer: Signer,
        keystore: KeyStore,
        fee: number,
        gas: number = 200_000,
        freight: number = 20_000,
    ) {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const collaterals = await Comptroller.GetCollaterals(
            keystore.publicKeyHash,
            comptroller,
            protocolAddresses,
            server,
        );
        const ops: Transaction[] = ExitMarketOpGroup(
            exitMarket,
            collaterals,
            protocolAddresses,
            keystore.publicKeyHash,
            gas,
            freight,
        );
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops, true);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    export async function estimateWithTaquito(
      tx: (Transaction | Delegation | Reveal)[],
      server: string,
      keystore: KeyStore
    ): Promise<(Transaction | Delegation | Reveal)[]> {
      let taquitoOps: ParamsWithKind[] = [];
      const Tezos = new TezosToolkit(server);
      Tezos.setProvider({signer:new MockTaquitoSigner(keystore)});
      tx.forEach((opval) => {
        switch (opval.kind) {
          case "transaction":
            const opt = opval as Transaction;
            taquitoOps.push({
              to: opt.destination,
              kind: OpKind.TRANSACTION,
              source: opt.source,
              amount: parseInt(opt.amount) || 0,
              parameter: opt.parameters as TransactionOperationParameter,
            });
            break;
          default:
            break;
        }
      });
      const estimates = await Tezos.estimate.batch(taquitoOps);
      if (estimates.length === tx.length) {
        let sum = 0;
        for (let i = 0; i < estimates.length; i++) {
          sum +=estimates[i].suggestedFeeMutez;
          tx[i].gas_limit = estimates[i].gasLimit.toString();
          tx[i].storage_limit = estimates[i].storageLimit.toString();
        }
        tx[0].fee = sum.toString();
      }
      return tx;
    }
}

export class MockTaquitoSigner implements TaquitSigner {
  private keyStore: KeyStore;
    constructor(keyStore: KeyStore) {
        this.keyStore = keyStore;
    }
  async publicKey(): Promise<string> {
    return this.keyStore.publicKey;
  }
  async publicKeyHash(): Promise<string> {
    return this.keyStore.publicKeyHash;
  }
  async secretKey(): Promise<string> {
    return this.keyStore.secretKey;
  }
  async sign(_bytes: string, _watermark?: Uint8Array): Promise<any> {
    return "signature";
  }
}