import { TransferParams } from '@taquito/taquito';
import { getContract } from './toolkit';
import { AssetType } from './enum';
import { ProtocolAddresses } from './types';
import bigInt from 'big-integer';
import log from 'loglevel';

export namespace Comptroller {

    export interface Market {
        assetType: AssetType;
        borrowPaused: boolean;
        collateralFactor: number;
        isListed: boolean;
        mintPaused: boolean;
        redeemPaused: boolean;
        price: bigInt.BigInteger;
        updateLevel: number;
    }

    export type MarketMap = { [assetType: string]: Market };

    export interface Storage {
        administrator: string;
        closeFactorMantissa: bigInt.BigInteger;
        liquidationIncentiveMantissa: bigInt.BigInteger;
        oracleAddress: string;
        pendingAdministrator: string | undefined;
        transferPaused: boolean;
        markets: MarketMap;
    }

    export async function GetMarkets(
        storage: any,
        dataStorage: any,
        protocolAddresses: ProtocolAddresses,
    ): Promise<MarketMap> {
        const recoveryMode = Boolean(protocolAddresses.comptrollerDataSource);
        const markets: MarketMap = {};
        await Promise.all(Object.values(protocolAddresses.fTokens).map(async (fTokenAddr) => {
            try {
                const marketEntry = await dataStorage.markets.get(fTokenAddr);
                const guardMarketEntry = recoveryMode
                    ? await storage.markets.get(fTokenAddr)
                    : marketEntry;
                if (marketEntry && guardMarketEntry) {
                    const asset = protocolAddresses.fTokensReverse[fTokenAddr];
                    markets[asset] = {
                        assetType: marketEntry.name as AssetType,
                        borrowPaused: recoveryMode || marketEntry.borrowPaused,
                        collateralFactor: Number(marketEntry.collateralFactor.toString()),
                        isListed: guardMarketEntry.isListed,
                        mintPaused: recoveryMode || marketEntry.mintPaused,
                        redeemPaused: guardMarketEntry.redeemPaused ?? marketEntry.redeemPaused ?? false,
                        price: bigInt(marketEntry.price.toString()),
                        updateLevel: Number(marketEntry.updateLevel.toString()),
                    };
                }
            } catch (e) {
                log.error(`Failed to get Comptroller.Markets for ${fTokenAddr}: ${e}`);
            }
        }));
        return markets;
    }

    export async function GetStorage(address: string, protocolAddresses: ProtocolAddresses, server: string): Promise<Storage> {
        const contract = await getContract(server, address);
        const storage: any = await contract.storage();
        const dataContract = protocolAddresses.comptrollerDataSource
            ? await getContract(server, protocolAddresses.comptrollerDataSource)
            : contract;
        const dataStorage: any = protocolAddresses.comptrollerDataSource
            ? await dataContract.storage()
            : storage;

        const markets = await GetMarkets(storage, dataStorage, protocolAddresses);

        return {
            administrator: storage.administrator,
            closeFactorMantissa: bigInt(dataStorage.closeFactorMantissa.toString()),
            liquidationIncentiveMantissa: bigInt(dataStorage.liquidationIncentiveMantissa.toString()),
            oracleAddress: dataStorage.oracleAddress,
            pendingAdministrator: storage.pendingAdministrator || undefined,
            transferPaused: dataStorage.transferPaused,
            markets,
        };
    }

    /**
     * Return the list of collateralized markets for address
     */
    export async function GetCollaterals(address: string, _comptroller: Storage, protocolAddresses: ProtocolAddresses, server: string): Promise<AssetType[]> {
        try {
            const contract = await getContract(
                server,
                protocolAddresses.comptrollerDataSource || protocolAddresses.comptroller,
            );
            const storage: any = await contract.storage();
            const collateralsSet = await storage.collaterals.get(address);
            if (!collateralsSet) return [];
            // collateralsSet is a set of addresses (TSet<TAddress>)
            const addresses: string[] = Array.isArray(collateralsSet) ? collateralsSet : [...collateralsSet];
            return addresses.map((addr) => protocolAddresses.fTokensReverse[addr]).filter(Boolean);
        } catch (err) {
            log.error(`${address} has no collateralized assets`);
            return [];
        }
    }

    // --- Operation builders (return TransferParams[]) ---

    export interface EnterMarketsPair {
        fTokens: string[];
    }

    export interface ExitMarketPair {
        address: string;
    }

    export interface UpdateAccountLiquidityPair {
        address: string;
    }

    export function DataRelevanceOpGroup(
        _collaterals: AssetType[],
        protocolAddresses: ProtocolAddresses,
        pkh: string,
        targetAddress: string = "",
    ): TransferParams[] {
        const address = targetAddress || pkh;
        return [{
            to: protocolAddresses.comptrollerDataSource || protocolAddresses.comptroller,
            amount: 0,
            mutez: true,
            parameter: { entrypoint: 'updateAccountLiquidityWithView', value: { string: address } },
        }];
    }

    export function EnterMarketsOperation(
        enterMarkets: EnterMarketsPair,
        comptrollerAddress: string,
        pkh: string,
    ): TransferParams {
        return {
            to: comptrollerAddress,
            amount: 0,
            mutez: true,
            parameter: {
                entrypoint: 'enterMarkets',
                value: enterMarkets.fTokens.map((addr) => ({ string: addr })),
            },
        };
    }

    export function ExitMarketOperation(
        exitMarket: ExitMarketPair,
        comptrollerAddress: string,
        pkh: string,
    ): TransferParams {
        return {
            to: comptrollerAddress,
            amount: 0,
            mutez: true,
            parameter: { entrypoint: 'exitMarket', value: { string: exitMarket.address } },
        };
    }
}
