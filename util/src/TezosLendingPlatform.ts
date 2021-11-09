import { KeyStore, Signer, TezosNodeReader, TezosNodeWriter, TezosContractUtils, Tzip7ReferenceTokenHelper, MultiAssetTokenHelper, UpdateOperator, Transaction, TezosConseilClient, ConseilServerInfo, ConseilQuery } from 'conseiljs';
import { FToken } from './FToken';
import { Comptroller } from './Comptroller';
import log from 'loglevel';

export namespace TezosLendingPlatform {
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
        fTokens: { [underlying: string]: string};
        fTokensReverse: { [address: string]: AssetType};
        underlying: { [assetType: string]: UnderlyingAsset };
        comptroller: string;
        interestRateModel: { [underlying: string]: string};
        governance: string;
        priceFeed: string;
    }

    /*
     * @description placeholder
     *
     * @param
     */
    export const mainnetAddresses = {} as ProtocolAddresses;

    /*
     * @description TODO: convert mantissa to number
     *
     * @param
     */
    export function ConvertFromMantissa(mantissa: number): number {
        return mantissa;
    }

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
        price: number;
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
        totalAmount: number;
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
     * @param dailyInterestPaid
     * @param reserves
     * @param reserveFactor
     * @param collateralFactor The collateral factor required for this asset
     * @param exchangeRate The fToken/underlying exchange rate. This increases as supply rate accrues
     */
    export interface Market {
        address: string;
        asset: UnderlyingAssetMetadata;
        cash: number;
        cashUsd: number;
        supply: MarketData;
        borrow: MarketData;
        dailyInterestPaid: number;
        reserves: number;
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
    export function MakeMarket(fToken: FToken.Storage, comptroller: Comptroller.Storage, address: string, name: string, underlying: UnderlyingAsset): Market {
        const asset: UnderlyingAssetMetadata = {
            name: name,
            underlying: underlying,
            administrator: fToken.administrator,
            price: comptroller.markets[underlying.assetType].price
        };
        const supply: MarketData = {
            // TODO
            // numParticipants: fToken.supply.numSuppliers?,
            numParticipants: 0,
            totalAmount: fToken.supply.totalSupply,
            rate: FToken.GetSupplyRate(fToken)
        };
        const borrow: MarketData = {
            // TODO
            // numParticipants: fToken.borrow.numBorrowers,
            numParticipants: 0,
            totalAmount: fToken.borrow.totalBorrows,
            rate: FToken.GetBorrowRate(fToken)
        };
        return {
            address: address,
            asset: asset,
            cash: FToken.GetCash(fToken),
            cashUsd: comptroller.markets[underlying.assetType].price * FToken.GetCash(fToken),
            supply: supply,
            borrow: borrow,
            dailyInterestPaid: 0,
            reserves: fToken.totalReserves,
            reserveFactor: ConvertFromMantissa(fToken.reserveFactorMantissa),
            collateralFactor: comptroller.markets[underlying.assetType].price,
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
        for (const asset in protocolAddresses.fTokens) {
            const fTokenAddress = protocolAddresses.fTokens[asset];
            const fTokenStorage: FToken.Storage = await FToken.GetStorage(fTokenAddress, server);
            // TODO: name from constants
            const name = "test"
            markets[asset] = MakeMarket(fTokenStorage, comptroller, fTokenAddress, name, protocolAddresses.underlying[asset]);
        }
        return markets;
    }

    /*
     * @description
     *
     * @param address Account address
     * @param marketBalances Account balances across all markets
     * @param totalCollateralUsd Total USD value of collateral
     * @param totalLoanUsd Total USD value of loans
     * @param health Account LTV ratio, totalCollateralUsd / TotalLoanUsd
     * @param rate Current net account rate across all markets, both supply and borrow, weighted by balance
     */
    export interface Account {
        address: string;
        marketBalances: FToken.BalanceMap;
        totalCollateralUsd: number;
        totalLoanUsd: number;
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
    export async function GetAccount(address: string, markets: MarketMap, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, conseilServerInfo: ConseilServerInfo): Promise<Account> {
        // check which markets are collaterals
        const collaterals = await Comptroller.GetCollaterals(address, comptroller, protocolAddresses, server);
        // get balance in each market
        const balances = await GetBalances(address, markets, protocolAddresses, server, conseilServerInfo);
        // get prices from oracle
        // calculate usd balances and collaterals
        for (const asset in balances) {
            balances[asset].supplyBalanceUsd = comptroller.markets[asset].price * balances[asset].supplyBalanceUnderlying;
            balances[asset].loanBalanceUsd = comptroller.markets[asset].price * balances[asset].loanBalanceUnderlying;
            if (collaterals.includes(asset as AssetType))
                balances[asset].collateral = true;
            else
                balances[asset].collateral = false;
        }
        let totalCollateralUsd = 0;
        let totalLoanUsd = 0;
        let rate = 1;
        for (const asset in balances) {
            // calculate total collateral and loan balance
            if (balances[asset].collateral!)
                totalCollateralUsd += balances[asset].supplyBalanceUsd!;
            totalLoanUsd += balances[asset].loanBalanceUsd!;
            // TODO: calculate net rate across all markets, weighted by balance
        }
        return {
            address: address,
            marketBalances: balances,
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
    export async function GetBalances(address: string, markets: MarketMap, protocolAddresses: ProtocolAddresses, server: string, conseilServerInfo: ConseilServerInfo): Promise<FToken.BalanceMap> {
        await Promise.all(Object.entries(protocolAddresses.fTokens).map(async (asset, fTokenAddress) => {
            // TODO
            // const balanceResult = await FToken.GetBalance(address, markets[asset].storage.balancesMapId, server, conseilServerInfo);
        }));
        return {} as FToken.BalanceMap;
    }

    /*
     * @description
     *
     * @param
     */
    export function calculateHealth(collateral: number, loans: number): number {
        return collateral / loans;
    }

    /*
     * @description
     *
     * @param
     */
    export interface SupplyComposition {
        assets: { assetType: AssetType, usdValue: number }[];
        collateral: number;
        totalUsdValue: number;
    }

    /*
     * @description
     *
     * @param
     */
    export function supplyComposition(account: Account): SupplyComposition {
        // parse account for SupplyComposition
        return {
            assets: [
                { assetType: AssetType.XTZ, usdValue: 10 },
                { assetType: AssetType.FA2, usdValue: 40 },
            ],
            collateral: 44,
            totalUsdValue: 100
        }
    }

    /*
     * @description
     *
     * @param
     */
    export interface BorrowComposition {
        assets: { assetType: AssetType, usdValue: number }[];
        borrowLimit: number;
        totalUsdValue: number;
    }

    /*
     * @description
     *
     * @param
     */
    export function borrowComposition(account: Account): BorrowComposition {
        return {
            assets: [
                { assetType: AssetType.XTZ, usdValue: 13 },
                { assetType: AssetType.FA2, usdValue: 15 },
            ],
            borrowLimit: 23,
            totalUsdValue: 400
        };
    }

    /*
     * @description
     *
     * @param
     */
    export interface SupplyMarket {

    }

    /*
     * @description
     *
     * @param
     */
    export function getSupplyMarkets(account: Account, markets: Market[]): { [assetType: string]: SupplyMarket } {
        return {};
    }

    /*
     * @description
     *
     * @param
     */
    export interface BorrowMarket {

    }

    /*
     * @description
     *
     * @param
     */
    export function getBorrowMarkets(account: Account, markets: Market[]): { [assetType: string]: BorrowMarket }{
        return {};
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
        borrowLimit: number;
        borrowLimitUsed: number
    }

    /*
     * @description
     *
     * @param
     */
    export function getSupplyMarketModal(account: Account, market: Market): SupplyMarketModal {
        return {} as SupplyMarketModal;
    }

    /*
     * @description
     *
     * @param rate Current rate paid by borrowers
     * @param borrowBalance Current USD amount borrowed
     * @param borrowLimitUsed Percentage of account's bhorrow limit currently used
     */
    export interface BorrowMarketModal {
        rate: number;
        borrowBalance: number;
        borrowLimitUsed: number
    }

    /*
     * @description
     *
     * @param
     */
    export function getBorrowMarketModal(account: Account, market: Market): BorrowMarketModal {
        return {} as BorrowMarketModal;
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
    export function permissionOperation(params: FToken.MintPair | FToken.RepayBorrowPair, cancelPermission: boolean, protocolAddresses: ProtocolAddresses, counter: number, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction | undefined {
        const underlying: UnderlyingAsset = protocolAddresses.underlying[params.underlying] == undefined
            ? { assetType: AssetType.XTZ }
            : protocolAddresses.underlying[params.underlying];
        switch (underlying.assetType) {
            case AssetType.FA12:
                // fa12 approval operation
                return cancelPermission ?
                    // fa12 approved balance is depleted, so no need to invoke again to cancel
                    undefined :
                    // fa12 approve balance
                    Tzip7ReferenceTokenHelper.ApproveBalanceOperation(params.amount, protocolAddresses.fTokens[params.underlying], counter, underlying.address!, keystore, fee, gas, freight);
            case AssetType.FA2:
                const updateOperator: UpdateOperator = {
                    owner: keystore.publicKeyHash,
                    operator: protocolAddresses.fTokens[params.underlying],
                    tokenid: underlying.tokenId!
                };
                return cancelPermission ?
                    // fa2 remove operator
                    MultiAssetTokenHelper.RemoveOperatorsOperation(underlying.address!, counter, keystore, fee, [updateOperator]) :
                    // fa2 add operator
                    MultiAssetTokenHelper.AddOperatorsOperation(underlying.address!, counter, keystore, fee, [updateOperator]);
            case AssetType.XTZ:
                return undefined;
        }
    }

    /*
     * Construct and invoke the operation group for minting fTokens.
     *
     * @param
     */
    export function MintOpGroup(mint: FToken.MintPair, protocolAddresses: ProtocolAddresses, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations([mint.underlying], protocolAddresses, 0, keystore, fee, gas, freight));
        // get permissions from underlying asset
        let permissionOp = permissionOperation(mint, false, protocolAddresses, 0, keystore, fee);
        if (permissionOp != undefined)
            ops.push(permissionOp);
        // mint operation
        ops.push(FToken.MintOperation(mint, 0, protocolAddresses.fTokens[mint.underlying], keystore, fee, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(mint, true, protocolAddresses, 0, keystore, fee);
        if (removePermissionOp != undefined)
            ops.push(removePermissionOp);
        return ops;
    }

    /*
     * Construct and invoke the operation group for minting fTokens.
     *
     * @param
     */
    export async function Mint(mint: FToken.MintPair, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        const ops: Transaction[] = MintOpGroup(mint, protocolAddresses, keystore, fee, gas, freight);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct and invoke the operation group for redeeming fTokens for the underlying asset.
     *
     * @param
     */
    export function RedeemOpGroup(redeem: FToken.RedeemPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        if (!collaterals.includes(redeem.underlying)) // need to accrueInterest on the redeemed market as well)
            collaterals.push(redeem.underlying);
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, 0, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, 0, keystore, fee));
        // redeem operation
        ops.push(FToken.RedeemOperation(redeem, 0, protocolAddresses.fTokens[redeem.underlying], keystore, fee, gas, freight));
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
        let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        const ops: Transaction[] = RedeemOpGroup(redeem, collaterals, protocolAddresses, keystore, fee);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct and invoke the operation group for borrowing underlying assets.
     *
     * @param
     */
    export function BorrowOpGroup(borrow: FToken.BorrowPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        if (!collaterals.includes(borrow.underlying)) // need to accrueInterest on the borrowed market as well
            collaterals.push(borrow.underlying);
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, 0, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, 0, keystore, fee));
        // borrow operation
        ops.push(FToken.BorrowOperation(borrow, 0, protocolAddresses.fTokens[borrow.underlying], keystore, fee, gas, freight));
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
        let ops: Transaction[] = [];
        let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        // accrue interest operation
        if (!collaterals.includes(borrow.underlying)) // need to accrueInterest on the borrowed market as well
            collaterals.push(borrow.underlying);
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, counter, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, counter, keystore, fee));
        // borrow operation
        ops.push(FToken.BorrowOperation(borrow, counter, protocolAddresses.fTokens[borrow.underlying], keystore, fee, gas, freight));
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }

    /*
     * Construct and invoke the operation group for repaying borrowed fTokens.
     *
     * @param
     */
    export function RepayBorrowOpGroup(repayBorrow: FToken.RepayBorrowPair, protocolAddresses: ProtocolAddresses, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations([repayBorrow.underlying], protocolAddresses, 0, keystore, fee, gas, freight));
        // get permissions from underlying asset
        let permissionOp = permissionOperation(repayBorrow, false, protocolAddresses, 0, keystore, fee);
        if (permissionOp != undefined)
            ops.push(permissionOp);
        // repayBorrow operation
        ops.push(FToken.RepayBorrowOperation(repayBorrow, 0, protocolAddresses.fTokens[repayBorrow.underlying], keystore, fee, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(repayBorrow, true, protocolAddresses, 0, keystore, fee);
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
        const ops: Transaction[] = RepayBorrowOpGroup(repayBorrow, protocolAddresses, keystore, fee, gas, freight);
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
    export function EnterMarketsOpGroup(enterMarkets: Comptroller.EnterMarketsPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, 0, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, 0, keystore, fee));
        // enterMarkets operation
        ops.push(Comptroller.EnterMarketsOperation(enterMarkets, protocolAddresses.comptroller, 0, keystore, fee, gas, freight));
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
        let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        const ops: Transaction[] = EnterMarketsOpGroup(enterMarkets, collaterals, protocolAddresses, keystore, fee);
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
    export function ExitMarketOpGroup(exitMarket: Comptroller.ExitMarketPair, collaterals: AssetType[], protocolAddresses: ProtocolAddresses, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Transaction[] {
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, 0, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, 0, keystore, fee));
        // enterMarkets operation
        ops.push(Comptroller.ExitMarketOperation(exitMarket, protocolAddresses.comptroller, 0, keystore, fee, gas, freight));
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
        let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        const ops: Transaction[] = ExitMarketOpGroup(exitMarket, collaterals, protocolAddresses, keystore, fee);
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }
}

