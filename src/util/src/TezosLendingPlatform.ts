import {
    Account,
    BorrowMarket,
    Market,
    MarketData,
    MarketMap,
    Network,
    ProtocolAddresses,
    SupplyMarket,
    UnderlyingAsset,
    UnderlyingAssetMetadata,
} from './types';
import { AssetType, TokenStandard } from './enum';
import { TransferParams } from '@taquito/taquito';
import { packDataBytes, unpackDataBytes } from '@taquito/michel-codec';
import { encodeExpr } from '@taquito/utils';
import { getContract, getToolkit } from './toolkit';
import { Comptroller } from './Comptroller';
import { FToken } from './FToken';
import { InterestRateModel } from './contracts/InterestRateModel';
import { PriceFeed } from './PriceFeed';
import bigInt from 'big-integer';
import { tokenNames } from './const';
import log from 'loglevel';
import { BigNumber } from 'bignumber.js';

export namespace TezosLendingPlatform {

    export function MakeMarket(
        fToken: FToken.Storage,
        comptroller: Comptroller.Storage,
        address: string,
        underlying: UnderlyingAsset,
        rateModel: InterestRateModel.Storage,
        price: bigInt.BigInteger,
        level: number,
        network: Network,
    ): Market {
        const asset: UnderlyingAssetMetadata = {
            name: tokenNames[underlying.assetType],
            underlying: underlying,
            administrator: fToken.administrator,
            price: comptroller.markets[underlying.assetType].price,
        };
        const supply: MarketData = {
            numParticipants: 0,
            totalAmount: fToken.supply.totalSupply,
            rate: FToken.getSupplyRateApy(fToken, rateModel, network),
            rateFn: (_additionalAmount: bigInt.BigInteger) => FToken.getSupplyRateApy(fToken, rateModel, network),
        };
        const borrow: MarketData = {
            numParticipants: 0,
            totalAmount: fToken.borrow.totalBorrows,
            rate: FToken.getBorrowRateApy(fToken, rateModel, network),
            rateFn: FToken.getDynamicBorrowRateApyFn(fToken, rateModel, network),
        };
        const available = FToken.applyExchangeRate(
            supply.totalAmount.minus(borrow.totalAmount).minus(fToken.totalReserves),
            fToken,
        );

        return {
            currentPrice: price,
            address: address,
            asset: asset,
            cash: FToken.GetCash(fToken),
            cashUsd: comptroller.markets[underlying.assetType].price.multiply(FToken.GetCash(fToken)),
            supply: supply,
            borrow: borrow,
            available: available,
            dailyInterestPaid: bigInt('0'),
            reserves: fToken.totalReserves,
            reserveFactor: fToken.reserveFactorMantissa.toJSNumber(),
            collateralFactor: comptroller.markets[underlying.assetType].collateralFactor,
            isListed: comptroller.markets[underlying.assetType].isListed,
            mintPaused: comptroller.markets[underlying.assetType].mintPaused,
            borrowPaused: comptroller.markets[underlying.assetType].borrowPaused,
            redeemPaused: comptroller.markets[underlying.assetType].redeemPaused,
            exchangeRate: FToken.getExchangeRate(fToken),
            storage: fToken,
            rateModel: rateModel,
            level: level,
        } as Market;
    }

    /**
     * Gets the market data for all markets in protocolAddresses.
     */
    export async function GetMarkets(
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
    ): Promise<MarketMap> {
        const markets: MarketMap = {};
        const toolkit = getToolkit(server);
        const head = await toolkit.rpc.getBlockHeader();

        await Promise.all(
            Object.keys(protocolAddresses.fTokens).map(async (asset) => {
                const fTokenAddress = protocolAddresses.fTokens[asset];
                const fTokenType = protocolAddresses.underlying[protocolAddresses.fTokensReverse[fTokenAddress]].tokenStandard;
                try {
                    const fTokenStorage = await FToken.GetStorage(
                        fTokenAddress,
                        protocolAddresses.underlying[protocolAddresses.fTokensReverse[fTokenAddress]],
                        server,
                        fTokenType,
                    );
                    const rateModel = await InterestRateModel.GetStorage(
                        server,
                        fTokenStorage.interestRateModel,
                    );
                    const oraclePrice = await PriceFeed.GetPrice(
                        protocolAddresses.fTokensReverse[fTokenAddress],
                        protocolAddresses.oracle,
                        head.level,
                        server,
                    );
                    const borrowRate = FToken.getBorrowRate(fTokenStorage, rateModel);
                    const fTokenStorageAfterAccrual = FToken.SimulateAccrueInterest(
                        borrowRate,
                        head.level + 5,
                        fTokenStorage,
                    );
                    markets[asset] = MakeMarket(
                        fTokenStorageAfterAccrual,
                        comptroller,
                        fTokenAddress,
                        protocolAddresses.underlying[asset],
                        rateModel,
                        oraclePrice,
                        head.level,
                        protocolAddresses.network,
                    );
                } catch (e) {
                    log.error(`Failed in GetMarkets for ${asset} at ${protocolAddresses.fTokens[asset]}: ${e}`);
                }
            }),
        );
        return markets;
    }

    /**
     * Returns the account corresponding to address.
     */
    export async function GetAccount(
        address: string,
        markets: MarketMap,
        comptroller: Comptroller.Storage,
        protocolAddresses: ProtocolAddresses,
        server: string,
    ): Promise<Account> {
        const collaterals = await Comptroller.GetCollaterals(address, comptroller, protocolAddresses, server);
        const underlyingBalances = await GetUnderlyingBalances(address, markets, protocolAddresses, server);
        const marketBalances = await GetFtokenBalances(address, markets, protocolAddresses, server);

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

        return {
            address,
            underlyingBalances,
            marketBalances,
            totalSupplyingUsd,
            totalCollateralUsd,
            totalLoanUsd,
            health: 1000,
            rate: 1,
        };
    }

    async function GetFtokenBalances(
        address: string,
        markets: MarketMap,
        protocolAddresses: ProtocolAddresses,
        server: string,
    ): Promise<FToken.BalanceMap> {
        const balances: FToken.BalanceMap = {};
        await Promise.all(
            Object.keys(markets).map(async (asset) => {
                balances[asset] = await FToken.GetBalance(
                    address,
                    asset as AssetType,
                    markets[asset].storage.borrow.borrowIndex,
                    protocolAddresses.fTokens[asset],
                    server,
                );
            }),
        );
        return balances;
    }

    async function GetUnderlyingBalances(
        address: string,
        markets: MarketMap,
        protocolAddresses: ProtocolAddresses,
        server: string,
    ): Promise<{ [asset: string]: BigNumber }> {
        const balances: { [asset: string]: BigNumber } = {};
        await Promise.all(
            Object.keys(markets).map(async (asset) => {
                const underlying = markets[asset].asset.underlying;
                if (underlying.tokenStandard === TokenStandard.XTZ) {
                    const toolkit = getToolkit(server);
                    const bal = await toolkit.tz.getBalance(address);
                    balances[asset] = new BigNumber(bal.toString());
                } else if (underlying.tokenStandard === TokenStandard.FA12_PACKED) {
                    try {
                        const toolkit = getToolkit(server);

                        // Pack address to extract raw 22-byte address representation
                        // Result: 05 0a 00000016 <22 bytes>
                        //         ^^ pack prefix
                        //            ^^ address tag
                        //               ^^^^^^^^ length (22 = 0x16)
                        //                        ^^^^^^^^^ actual address bytes we need
                        const addrPacked = packDataBytes(
                            { string: address },
                            { prim: 'address' }
                        );
                        // Skip: "05"(1 byte) + "0a"(1 byte) + "00000016"(4 bytes) = 12 hex chars
                        const rawAddressHex = addrPacked.bytes.slice(12);

                        // Step 1: pack Pair "ledger" <rawAddressHex>
                        const innerPacked = packDataBytes(
                            {
                                prim: 'Pair',
                                args: [
                                    { string: 'ledger' },
                                    { bytes: rawAddressHex }
                                ]
                            },
                            {
                                prim: 'pair',
                                args: [{ prim: 'string' }, { prim: 'bytes' }]
                            }
                        );

                        // Step 2: pack the Pair result as bytes (big_map key type is `bytes`)
                        const outerPacked = packDataBytes(
                            { bytes: innerPacked.bytes },
                            { prim: 'bytes' }
                        );

                        const keyHash = encodeExpr(outerPacked.bytes);

                        const value: any = await toolkit.rpc.getBigMapExpr(
                            underlying.balancesMapId!.toString(),
                            keyHash,
                        );

                        if (!value || !value.bytes) {
                            balances[asset] = new BigNumber(0);
                        } else {
                            const unpacked: any = unpackDataBytes({ bytes: value.bytes });
                            const balance = unpacked?.args?.[0]?.int ?? unpacked?.int;
                            balances[asset] = new BigNumber(balance ?? 0);
                        }
                    } catch (e) {
                        log.error(`Unable to read packed balance for ${asset}: ${e}`);
                        balances[asset] = new BigNumber(0);
                    }
                } else {
                    try {
                        const tokenContract = await getContract(server, underlying.address!);
                        const tokenStorage: any = await tokenContract.storage();
                        const ledger = tokenStorage.ledger ?? tokenStorage.tokens ?? tokenStorage.balances;
                        if (!ledger) {
                            balances[asset] = new BigNumber(0);
                        } else if (underlying.tokenStandard === TokenStandard.FA12) {
                            const entry = await ledger.get(address);
                            balances[asset] = entry ? new BigNumber((entry.balance ?? entry['0'] ?? entry).toString()) : new BigNumber(0);
                        } else if (underlying.tokenStandard === TokenStandard.FA2) {
                            const tokenId = underlying.tokenId ?? 0;
                            let entry = await ledger.get({ owner: address, token_id: tokenId });
                            if (entry === undefined) {
                                try {
                                    entry = await ledger.get({ 0: address, 1: tokenId });
                                } catch {
                                    // Some contracts only accept named keys; positional fallback is not applicable
                                }
                            }
                            balances[asset] = entry ? new BigNumber(entry.toString()) : new BigNumber(0);
                        }
                    } catch (e) {
                        log.error(`Unable to read underlying balance for ${asset}: ${e}`);
                        balances[asset] = new BigNumber(0);
                    }
                }
            }),
        );
        return balances;
    }

    // --- Market display helpers ---

    export function getSuppliedMarkets(account: Account, markets: MarketMap): { [assetType: string]: SupplyMarket } {
        return parseSupplyMarkets(account.marketBalances, markets, (bi) => bi.geq(bigInt(0)));
    }

    export function getBorrowedMarkets(account: Account, markets: MarketMap): { [assetType: string]: BorrowMarket } {
        return parseBorrowMarkets(account.marketBalances, markets, (bi) => bi.geq(bigInt(0)));
    }

    function parseSupplyMarkets(
        balances: FToken.BalanceMap | undefined,
        markets: MarketMap,
        compare: (bi: bigInt.BigInteger) => boolean,
    ): { [assetType: string]: SupplyMarket } {
        const assets: AssetType[] = balances
            ? Object.keys(balances).map((a) => a as AssetType)
            : Object.keys(markets).map((a) => a as AssetType);

        const suppliedMarkets: { [assetType: string]: SupplyMarket } = {};
        for (const asset of assets) {
            if (balances && balances[asset] && compare(balances[asset].supplyBalanceUnderlying)) {
                suppliedMarkets[asset] = {
                    rate: markets[asset].supply.rate,
                    balance: balances[asset].supplyBalanceUnderlying,
                    balanceUnderlying: FToken.applyExchangeRate(balances[asset].supplyBalanceUnderlying, markets[asset].storage),
                    balanceUsd: balances[asset].supplyBalanceUsd!,
                    collateral: balances[asset].collateral!,
                };
            } else {
                suppliedMarkets[asset] = {
                    rate: markets[asset].supply.rate,
                    balance: bigInt(0),
                    balanceUnderlying: new BigNumber(0),
                    balanceUsd: bigInt(0),
                    collateral: false,
                };
            }
        }
        return suppliedMarkets;
    }

    function parseBorrowMarkets(
        balances: FToken.BalanceMap | undefined,
        markets: MarketMap,
        compare: (bi: bigInt.BigInteger) => boolean,
    ): { [assetType: string]: BorrowMarket } {
        const assets: AssetType[] = balances
            ? Object.keys(balances).map((a) => a as AssetType)
            : Object.keys(markets).map((a) => a as AssetType);

        const borrowedMarkets: { [assetType: string]: BorrowMarket } = {};
        for (const asset of assets) {
            if (balances && balances[asset] && compare(balances[asset].loanBalanceUnderlying)) {
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

    // --- OpGroup builders (return TransferParams[]) ---

    /**
     * Build permission operations for underlying token (FA1.2 approve / FA2 update_operators).
     */
    export function permissionOperation(
        asset: AssetType,
        amount: number,
        cancelPermission: boolean,
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] | undefined {
        const underlying: UnderlyingAsset =
            protocolAddresses.underlying[asset] ?? { assetType: AssetType.XTZ, tokenStandard: TokenStandard.XTZ, decimals: 6 };

        switch (underlying.tokenStandard) {
            case TokenStandard.FA12:
                if (cancelPermission) return undefined;
                // Reset approval to 0, then set to amount
                return [
                    {
                        to: underlying.address!,
                        amount: 0,
                        mutez: true,
                        parameter: {
                            entrypoint: 'approve',
                            value: {
                                prim: 'Pair',
                                args: [{ string: protocolAddresses.fTokens[asset] }, { int: '0' }],
                            },
                        },
                    },
                    {
                        to: underlying.address!,
                        amount: 0,
                        mutez: true,
                        parameter: {
                            entrypoint: 'approve',
                            value: {
                                prim: 'Pair',
                                args: [{ string: protocolAddresses.fTokens[asset] }, { int: String(amount) }],
                            },
                        },
                    },
                ];
            case TokenStandard.FA2: {
                const operatorParam = {
                    prim: 'Pair',
                    args: [
                        { string: pkh },
                        { prim: 'Pair', args: [{ string: protocolAddresses.fTokens[asset] }, { int: String(underlying.tokenId ?? 0) }] },
                    ],
                };
                const variant = cancelPermission ? 'Right' : 'Left';
                return [{
                    to: underlying.address!,
                    amount: 0,
                    mutez: true,
                    parameter: {
                        entrypoint: 'update_operators',
                        value: [{ prim: variant, args: [operatorParam] }],
                    },
                }];
            }
            case TokenStandard.XTZ:
                return undefined;
        }
    }

    export function MintOpGroup(
        mint: FToken.MintPair,
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] {
        mint.underlying = mint.underlying.toUpperCase() as AssetType;
        let ops: TransferParams[] = [];
        // Accrue interest on all markets
        ops = ops.concat(FToken.AccrueInterestOpGroup(
            Object.keys(protocolAddresses.fTokens) as AssetType[],
            protocolAddresses,
            pkh,
        ));
        // Permission for underlying token
        const permOp = permissionOperation(mint.underlying, mint.amount, false, protocolAddresses, pkh);
        if (permOp) ops.push(...permOp);
        // Mint
        ops.push(FToken.MintOperation(mint, protocolAddresses.fTokens[mint.underlying], pkh));
        // Remove permission
        const removePermOp = permissionOperation(mint.underlying, mint.amount, true, protocolAddresses, pkh);
        if (removePermOp) ops.push(...removePermOp);
        return ops;
    }

    export function RedeemOpGroup(
        redeem: FToken.RedeemPair,
        _collaterals: AssetType[] | string,
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] {
        let ops: TransferParams[] = [];
        // Data relevance (updateAccountLiquidityWithView)
        ops = ops.concat(Comptroller.DataRelevanceOpGroup([], protocolAddresses, pkh));
        // Redeem
        ops.push(FToken.RedeemOperation(redeem, protocolAddresses.fTokens[redeem.underlying], pkh));
        return ops;
    }

    export function BorrowOpGroup(
        borrow: FToken.BorrowPair,
        _collaterals: AssetType[] | string[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] {
        let ops: TransferParams[] = [];
        // Data relevance
        ops = ops.concat(Comptroller.DataRelevanceOpGroup([], protocolAddresses, pkh));
        // Borrow
        ops.push(FToken.BorrowOperation(borrow, protocolAddresses.fTokens[borrow.underlying], pkh));
        return ops;
    }

    export function RepayBorrowOpGroup(
        repayBorrow: FToken.RepayBorrowPair,
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] {
        let ops: TransferParams[] = [];
        // Accrue interest
        ops = ops.concat(FToken.AccrueInterestOpGroup(
            Object.keys(protocolAddresses.fTokens) as AssetType[],
            protocolAddresses,
            pkh,
        ));
        // Permission
        const permOp = permissionOperation(repayBorrow.underlying, repayBorrow.amount, false, protocolAddresses, pkh);
        if (permOp) ops.push(...permOp);
        // RepayBorrow
        ops.push(FToken.RepayBorrowOperation(repayBorrow, protocolAddresses.fTokens[repayBorrow.underlying], pkh));
        // Remove permission
        const removePermOp = permissionOperation(repayBorrow.underlying, repayBorrow.amount, true, protocolAddresses, pkh);
        if (removePermOp) ops.push(...removePermOp);
        return ops;
    }

    export function EnterMarketsOpGroup(
        enterMarkets: Comptroller.EnterMarketsPair,
        _collaterals: AssetType[] | string[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] {
        let ops: TransferParams[] = [];
        // Data relevance
        ops = ops.concat(Comptroller.DataRelevanceOpGroup([], protocolAddresses, pkh));
        // EnterMarkets
        ops.push(Comptroller.EnterMarketsOperation(enterMarkets, protocolAddresses.comptroller, pkh));
        return ops;
    }

    export function ExitMarketOpGroup(
        exitMarket: Comptroller.ExitMarketPair,
        _collaterals: AssetType[] | string[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
    ): TransferParams[] {
        let ops: TransferParams[] = [];
        // Data relevance
        ops = ops.concat(Comptroller.DataRelevanceOpGroup([], protocolAddresses, pkh));
        // ExitMarket
        ops.push(Comptroller.ExitMarketOperation(exitMarket, protocolAddresses.comptroller, pkh));
        return ops;
    }
}
