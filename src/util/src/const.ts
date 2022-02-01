import { AssetType, TokenStandard } from './enum';

import { ProtocolAddresses } from './types';

export const decimals = {
    "XTZ": 6,
    "ETH": 18,
    "BTC": 8,
    "USD": 6,
    "ETHtz": 18,
    "BTCtz": 8,
    "USDtz": 6,
}

export const granadanetAddresses: ProtocolAddresses = {
    fTokens: {
        "XTZ": "KT1KaLR4woR7bTyqZGknM5mnZyukDKmyF5cf",
        "ETH": "KT1PKi3L5CgxbGm8qTzrck8zBfrmhui8jVxe",
        "BTC": "KT1SEvLFnXa5xHUWRHp6y1pEersbR7SSGGtQ",
        "USD": "KT1GcriPWWKCaUFp5TzWfNXSeiGLhoztr2f5"
    },
    fTokensReverse: {
        "KT1KaLR4woR7bTyqZGknM5mnZyukDKmyF5cf": AssetType.XTZ,
        "KT1PKi3L5CgxbGm8qTzrck8zBfrmhui8jVxe": AssetType.ETH,
        "KT1GcriPWWKCaUFp5TzWfNXSeiGLhoztr2f5": AssetType.USD,
        "KT1SEvLFnXa5xHUWRHp6y1pEersbR7SSGGtQ": AssetType.BTC
    },
    underlying: {
        "ETH": {
            assetType: AssetType.ETH,
            tokenStandard: TokenStandard.FA12,
            decimals: 18,
            address: "KT1TVRtzyN7QysJquDBD6e36Etzj3w7jxReQ",
            balancesMapId: 39991,
            balancesPath: "$.args[1].int"
        },
        "USD": {
            assetType: AssetType.USD,
            tokenStandard: TokenStandard.FA12,
            decimals: 6,
            address: "KT1V7E1Wj9fAiaq7F2d942GzKLWuZrVuqxrx",
            balancesMapId: 39991,
            balancesPath: "$.args[1].int"
        },
        "BTC": {
            assetType: AssetType.BTC,
            tokenStandard: TokenStandard.FA2,
            decimals: 8,
            address: "KT1JqmwY3JJoHN7uh75pALrAx6sSpRbEZc9R",
            tokenId: 0,
            balancesMapId: 39994,
            balancesPath: "$.int"
        },
        "XTZ": {
            assetType: AssetType.XTZ,
            tokenStandard: TokenStandard.XTZ,
            decimals: 6
        }
    },
    comptroller: "KT1QfVHeiSQRTHPea4vK6xPSWYoQN6kiybL2",
    interestRateModel: {
        "XTZ": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH",
        "ETH": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH",
        "BTC": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH",
        "USD": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH"
    },
    governance: "KT1FXgqoeqXYEyUe28od6u8wvoyNvYZYDMK5",
    oracleMap: {
        "ETH": {
            id: 18599,
            path: "$.args[0].args[0].int"
        },
        "USD": {
            id: 116362,
            path: "$.args[1].int"
        },
        "BTC": {
            id: 18599,
            path: "$.args[0].args[0].int"
        },
        "XTZ": {
            id: 18599,
            path: "$.args[0].args[0].int"
        }
    }
};

export const tokenNames: { [assetType: string]: string } = {
    "ETH": "ETH",
    "USD": "USD",
    "BTC": "BTC"
};

export const expectedBlocksPerYear = 2 * 60 * 24 * 365;