import { expect } from 'chai';
import { afterEach, beforeEach, describe, it } from 'mocha';
import bigInt from 'big-integer';
import { Comptroller } from '../src/Comptroller';
import { AssetType, TokenStandard } from '../src/enum';
import { FToken } from '../src/FToken';
import { InterestRateModel } from '../src/contracts/InterestRateModel';
import { PriceFeed } from '../src/PriceFeed';
import { TezosLendingPlatform } from '../src/TezosLendingPlatform';
import { Network, ProtocolAddresses } from '../src/types';

const fXTZ = 'KT1-fXTZ';
const fUSDT = 'KT1-fUSDT';

function protocolAddresses(recoveryMode: boolean): ProtocolAddresses {
    return {
        fTokens: {
            [AssetType.XTZ]: fXTZ,
            [AssetType.USDT]: fUSDT,
        },
        fTokensReverse: {
            [fXTZ]: AssetType.XTZ,
            [fUSDT]: AssetType.USDT,
        },
        underlying: {
            [AssetType.XTZ]: {
                assetType: AssetType.XTZ,
                tokenStandard: TokenStandard.XTZ,
                decimals: 6,
            },
        },
        comptroller: 'KT1-guard',
        comptrollerDataSource: recoveryMode ? 'KT1-legacy' : undefined,
        interestRateModel: {},
        governance: 'KT1-governance',
        oracle: 'KT1-oracle',
        network: Network.Mainnet,
    };
}

function entrypoints(operations: any[]): string[] {
    return operations.map((operation) => operation.parameter.entrypoint);
}

describe('recovery operation groups', () => {
    it('accrues only the selected market before redeeming', () => {
        const operations = TezosLendingPlatform.RedeemOpGroup(
            { underlying: AssetType.XTZ, amount: 10, amountInUnderlying: false },
            AssetType.XTZ,
            protocolAddresses(true),
            'tz1-user',
        );

        expect(entrypoints(operations)).to.deep.equal(['accrueInterest', 'redeem']);
        expect(operations.map((operation) => operation.to)).to.deep.equal([fXTZ, fXTZ]);
    });

    it('keeps the legacy liquidity update before redeeming', () => {
        const operations = TezosLendingPlatform.RedeemOpGroup(
            { underlying: AssetType.XTZ, amount: 10, amountInUnderlying: false },
            AssetType.XTZ,
            protocolAddresses(false),
            'tz1-user',
        );

        expect(entrypoints(operations)).to.deep.equal(['updateAccountLiquidityWithView', 'redeem']);
        expect(operations[0].to).to.equal('KT1-guard');
    });

    it('accrues only the market being repaid in recovery mode', () => {
        const operations = TezosLendingPlatform.RepayBorrowOpGroup(
            { underlying: AssetType.XTZ, amount: 10 },
            protocolAddresses(true),
            'tz1-user',
        );

        expect(entrypoints(operations)).to.deep.equal(['accrueInterest', 'repayBorrow']);
        expect(operations.map((operation) => operation.to)).to.deep.equal([fXTZ, fXTZ]);
    });

    it('keeps all-market accrual for legacy repayments', () => {
        const operations = TezosLendingPlatform.RepayBorrowOpGroup(
            { underlying: AssetType.XTZ, amount: 10 },
            protocolAddresses(false),
            'tz1-user',
        );

        expect(entrypoints(operations)).to.deep.equal(['accrueInterest', 'accrueInterest', 'repayBorrow']);
        expect(operations.map((operation) => operation.to)).to.deep.equal([fXTZ, fUSDT, fXTZ]);
    });
});

describe('oracle failures', () => {
    const toolkitModule = require('../src/toolkit');
    const originalGetToolkit = toolkitModule.getToolkit;
    const originalGetPrice = PriceFeed.GetPrice;
    const originalGetFTokenStorage = FToken.GetStorage;
    const originalGetInterestRateStorage = InterestRateModel.GetStorage;
    const oracleError = new Error('oracle unavailable');
    const scale = bigInt('1000000000000000000');

    function fTokenStorage(): FToken.Storage {
        return {
            accrualBlockNumber: 1,
            administrator: 'tz1-admin',
            supply: {
                totalSupply: bigInt(100),
                supplyRatePerBlock: bigInt(0),
            },
            borrow: {
                totalBorrows: bigInt(0),
                borrowIndex: scale,
                borrowRateMaxMantissa: scale,
                borrowRatePerBlock: bigInt(0),
            },
            comptrollerAddress: 'KT1-guard',
            expScale: scale,
            halfExpScale: scale.divide(2),
            initialExchangeRateMantissa: scale,
            protocolSeizeShareMantissa: bigInt(0),
            interestRateModel: 'KT1-rate-model',
            pendingAdministrator: undefined,
            reserveFactorMantissa: bigInt(0),
            reserveFactorMaxMantissa: scale,
            totalReserves: bigInt(0),
            currentCash: bigInt(100),
        };
    }

    const rateModel: InterestRateModel.Storage = {
        blockRate: bigInt(0),
        blockMultiplier: bigInt(0),
        jumpMultiplier: bigInt(0),
        kink: scale,
        scale,
    };
    const comptrollerStorage = {
        markets: {
            [AssetType.XTZ]: {
                assetType: AssetType.XTZ,
                borrowPaused: true,
                collateralFactor: 0,
                isListed: true,
                mintPaused: true,
                redeemPaused: false,
                price: bigInt(0),
                updateLevel: 1,
            },
        },
    } as Comptroller.Storage;

    beforeEach(() => {
        toolkitModule.getToolkit = () => ({
            rpc: {
                getBlockHeader: async () => ({ level: 10 }),
            },
        });
        (PriceFeed as any).GetPrice = async () => {
            throw oracleError;
        };
        (FToken as any).GetStorage = async () => fTokenStorage();
        (InterestRateModel as any).GetStorage = async () => rateModel;
    });

    afterEach(() => {
        toolkitModule.getToolkit = originalGetToolkit;
        (PriceFeed as any).GetPrice = originalGetPrice;
        (FToken as any).GetStorage = originalGetFTokenStorage;
        (InterestRateModel as any).GetStorage = originalGetInterestRateStorage;
    });

    it('keeps repayment and withdrawal available in recovery mode when getPrice fails', async () => {
        const addresses = protocolAddresses(true);
        addresses.fTokens = { [AssetType.XTZ]: fXTZ };
        addresses.fTokensReverse = { [fXTZ]: AssetType.XTZ };
        addresses.interestRateModel = { [AssetType.XTZ]: 'KT1-rate-model' };

        const markets = await TezosLendingPlatform.GetMarkets(comptrollerStorage, addresses, 'https://rpc.example');
        const redeemOperations = TezosLendingPlatform.RedeemOpGroup(
            { underlying: AssetType.XTZ, amount: 10, amountInUnderlying: false },
            AssetType.XTZ,
            addresses,
            'tz1-user',
        );
        const repayOperations = TezosLendingPlatform.RepayBorrowOpGroup(
            { underlying: AssetType.XTZ, amount: 10 },
            addresses,
            'tz1-user',
        );

        expect(markets[AssetType.XTZ].currentPrice.toString()).to.equal('0');
        expect(entrypoints(redeemOperations)).to.deep.equal(['accrueInterest', 'redeem']);
        expect(entrypoints(repayOperations)).to.deep.equal(['accrueInterest', 'repayBorrow']);
    });

    it('does not suppress getPrice failures outside recovery mode', async () => {
        const addresses = protocolAddresses(false);
        addresses.fTokens = { [AssetType.XTZ]: fXTZ };
        addresses.fTokensReverse = { [fXTZ]: AssetType.XTZ };
        addresses.interestRateModel = { [AssetType.XTZ]: 'KT1-rate-model' };
        let thrown: unknown;

        try {
            await TezosLendingPlatform.GetMarkets(comptrollerStorage, addresses, 'https://rpc.example');
        } catch (error) {
            thrown = error;
        }

        expect(thrown).to.equal(oracleError);
    });
});

describe('Guard and legacy market storage', () => {
    const legacyMarket = {
        name: AssetType.XTZ,
        borrowPaused: false,
        collateralFactor: { toString: () => '500000000000000000' },
        isListed: true,
        mintPaused: false,
        price: { toString: () => '1000000000000000000' },
        updateLevel: { toString: () => '1' },
    };
    const guardMarket = {
        isListed: true,
        redeemPaused: false,
    };

    it('disables mint and borrow when Guard storage has no pause fields', async () => {
        const guardStorage = { markets: { get: async () => guardMarket } };
        const legacyStorage = { markets: { get: async () => legacyMarket } };
        const addresses = protocolAddresses(true);
        addresses.fTokens = { [AssetType.XTZ]: fXTZ };

        const markets = await Comptroller.GetMarkets(guardStorage, legacyStorage, addresses);

        expect(markets[AssetType.XTZ].mintPaused).to.equal(true);
        expect(markets[AssetType.XTZ].borrowPaused).to.equal(true);
        expect(markets[AssetType.XTZ].redeemPaused).to.equal(false);
    });

    it('preserves legacy pause values outside recovery mode', async () => {
        const storage = { markets: { get: async () => legacyMarket } };
        const addresses = protocolAddresses(false);
        addresses.fTokens = { [AssetType.XTZ]: fXTZ };

        const markets = await Comptroller.GetMarkets(storage, storage, addresses);

        expect(markets[AssetType.XTZ].mintPaused).to.equal(false);
        expect(markets[AssetType.XTZ].borrowPaused).to.equal(false);
    });
});