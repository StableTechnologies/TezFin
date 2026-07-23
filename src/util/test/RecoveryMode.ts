import { expect } from 'chai';
import { describe, it } from 'mocha';
import { Comptroller } from '../src/Comptroller';
import { AssetType, TokenStandard } from '../src/enum';
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