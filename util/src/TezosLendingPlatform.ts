import { KeyStore, Signer, TezosNodeReader, TezosNodeWriter, TezosContractUtils, Tzip7ReferenceTokenHelper, MultiAssetTokenHelper, UpdateOperator, Transaction } from 'conseiljs';
import { FToken } from './FToken';
import { Comptroller } from './Comptroller';

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
        underlying: { [tokenName: string]: UnderlyingAsset };
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
    }

    /*
     * Get a market's metadata
     *
     * @param address The fToken contract address to query
     */
    export async function GetMarkets(protocolAddresses: ProtocolAddresses): Promise<{ [assetType: string]: Market }> {
        // for asset, addr in protocolAddresses.fTokens
        // FToken.GetStorage(addr)
        // map to Market objects
        let ret: { [assetType: string]: Market } = {};
        ret[AssetType.XTZ] = {
            address: "kt18a7h89",
            asset: {
                name: "cXTZ",
                underlying: {
                    assetType: AssetType.XTZ
                } as UnderlyingAsset,
                administrator: "tz123456",
                price: 5
            } as UnderlyingAssetMetadata,
            cash: 100,
            cashUsd: 500,
            supply: {
                numParticipants: 1,
                totalAmount: 100,
                rate: 1.05
            } as MarketData,
            borrow: {
                numParticipants: 1,
                totalAmount: 20,
                rate: 1.01
            } as MarketData,
            dailyInterestPaid: 0.3,
            reserves: 0,
            reserveFactor: 0,
            collateralFactor: 0.6,
            exchangeRate: 1.04
        };
        ret[AssetType.FA12] = {
            address: "kt14h17934y",
            asset: {
                name: "cETH",
                underlying: {
                    assetType: AssetType.FA12
                } as UnderlyingAsset,
                administrator: "tz123456",
                price: 5
            } as UnderlyingAssetMetadata,
            cash: 200,
            cashUsd: 1000,
            supply: {
                numParticipants: 1,
                totalAmount: 200,
                rate: 1.05
            } as MarketData,
            borrow: {
                numParticipants: 1,
                totalAmount: 400,
                rate: 1.01
            } as MarketData,
            dailyInterestPaid: 0.3,
            reserves: 0,
            reserveFactor: 0,
            collateralFactor: 0.6,
            exchangeRate: 1.04
        };
        return ret;
    }

    /*
     * @description
     *
     * @param assetType
     * @param supplyBalanceUnderlying Total underlying token amount supplied, fTokenBalance * exchangeRate
     * @param supplyBalanceUsd Total USD value of funds supplied
     * @param loanBalanceUnderlying Total underlying token amount borrowed
     * @param loanBalanceUsd Total USD value of funds borrowed
     * @param collateral True if market is collateralized, false otherwise
     */
    export interface MarketBalance {
        assetType: AssetType;
        supplyBalanceUnderlying: number;
        supplyBalanceUsd: number
        loanBalanceUnderlying: number;
        loanBalanceUsd: number;
        collateral: boolean;
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
        marketBalances: { [assetType: string]: MarketBalance };
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
     */
    export async function GetAccount(address: string, markets: Market[], protocolAddresses: ProtocolAddresses): Promise<Account> {
        // check which markets are collaterals
        // get balance in each market
        // calculate usd balances using market exchange rate
        // calculate total collateral and account health
        // calculate net rate across all markets, weighted by balance
        let marketBalances: { [assetType: string]: MarketBalance } = {};
        marketBalances[AssetType.XTZ] = {
            assetType: AssetType.XTZ,
            supplyBalanceUnderlying:  100,
            supplyBalanceUsd: 500,
            loanBalanceUnderlying: 20,
            loanBalanceUsd: 100,
            collateral: true
        };
        marketBalances[AssetType.FA12] = {
            assetType: AssetType.FA12,
            supplyBalanceUnderlying:  200,
            supplyBalanceUsd: 1000,
            loanBalanceUnderlying: 40,
            loanBalanceUsd: 200,
            collateral: true
        };
        return {
            address: "kt2327a4b3h4",
            marketBalances: marketBalances,
            totalCollateralUsd: 500,
            totalLoanUsd: 100,
            health: 0.2,
            rate: 1.04
        } as Account;
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
        return {}
    }

    // TODO: Price feed oracle
    export interface PriceFeed {
        address: string;
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
    export async function Mint(mint: FToken.MintPair, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations([mint.underlying], protocolAddresses, counter, keystore, fee, gas, freight));
        // get permissions from underlying asset
        let permissionOp = permissionOperation(mint, false, protocolAddresses, counter, keystore, fee);
        if (permissionOp != undefined)
            ops.push(permissionOp);
        // mint operation
        ops.push(FToken.MintOperation(mint, counter, protocolAddresses.fTokens[mint.underlying], keystore, fee, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(mint, true, protocolAddresses, counter, keystore, fee);
        if (removePermissionOp != undefined)
            ops.push(removePermissionOp);
        // TODO: return ops for beacon
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
    export async function Redeem(redeem: FToken.RedeemPair, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = [];
        let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        // accrue interest operation
        if (!collaterals.includes(redeem.underlying)) // need to accrueInterest on the redeemed market as well)
            collaterals.push(redeem.underlying);
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, counter, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, counter, keystore, fee));
        // redeem operation
        ops.push(FToken.RedeemOperation(redeem, counter, protocolAddresses.fTokens[redeem.underlying], keystore, fee, gas, freight));
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
    export async function RepayBorrow(repayBorrow: FToken.RepayBorrowPair, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000): Promise<string> {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = [];
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations([repayBorrow.underlying], protocolAddresses, counter, keystore, fee, gas, freight));
        // get permissions from underlying asset
        let permissionOp = permissionOperation(repayBorrow, false, protocolAddresses, counter, keystore, fee);
        if (permissionOp != undefined)
            ops.push(permissionOp);
        // repayBorrow operation
        ops.push(FToken.RepayBorrowOperation(repayBorrow, counter, protocolAddresses.fTokens[repayBorrow.underlying], keystore, fee, gas, freight));
        // remove permissions from underlying asset
        let removePermissionOp = permissionOperation(repayBorrow, true, protocolAddresses, counter, keystore, fee);
        if (removePermissionOp != undefined)
            ops.push(removePermissionOp);
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
    export async function EnterMarkets(enterMarkets: Comptroller.EnterMarketsPair, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000) {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = [];
        let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, counter, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, counter, keystore, fee));
        // enterMarkets operation
        ops.push(Comptroller.EnterMarketsOperation(enterMarkets, protocolAddresses.comptroller, counter, keystore, fee, gas, freight));
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
    export async function ExitMarket(exitMarket: Comptroller.ExitMarketPair, comptroller: Comptroller.Storage, protocolAddresses: ProtocolAddresses, server: string, signer: Signer, keystore: KeyStore, fee: number, gas: number = 800_000, freight: number = 20_000) {
        // get account counter
        const counter = await TezosNodeReader.getCounterForAccount(server, keystore.publicKeyHash);
        let ops: Transaction[] = [];
        let collaterals = await Comptroller.GetCollaterals(keystore.publicKeyHash, comptroller, protocolAddresses, server);
        // accrue interest operation
        ops = ops.concat(FToken.AccrueInterestOperations(collaterals, protocolAddresses, counter, keystore, fee, gas, freight));
        // comptroller data relevance
        ops = ops.concat(Comptroller.DataRelevanceOperations(collaterals, protocolAddresses, counter, keystore, fee));
        // enterMarkets operation
        ops.push(Comptroller.ExitMarketOperation(exitMarket, protocolAddresses.comptroller, counter, keystore, fee, gas, freight));
        // prep operation
        const opGroup = await TezosNodeWriter.prepareOperationGroup(server, keystore, counter, ops);
        // send operation
        const operationResult = await TezosNodeWriter.sendOperation(server, opGroup, signer);
        return TezosContractUtils.clearRPCOperationGroupHash(operationResult.operationGroupID);
    }
}

