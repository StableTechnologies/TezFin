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
        "BTC": "KT1A7wKhkPhgfjUUZSa2TusWWrshHKwftUDc",
        "XTZ": "KT1AZQqgMRuMn36j1ENgUbbBePLqLqjCbMrY",
        "ETH": "KT19cqTZHgda91W8EuBL8LPNhnwwVa1knpgZ",
        "USD": "KT1MPWZEoG4civwcNtBmbHjFyuAQ7KkHwHaz"
    },
    fTokensReverse: {
        "KT1AZQqgMRuMn36j1ENgUbbBePLqLqjCbMrY": AssetType.XTZ,
        "KT19cqTZHgda91W8EuBL8LPNhnwwVa1knpgZ": AssetType.ETH,
        "KT1MPWZEoG4civwcNtBmbHjFyuAQ7KkHwHaz": AssetType.USD,
        "KT1A7wKhkPhgfjUUZSa2TusWWrshHKwftUDc": AssetType.BTC
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
            balancesMapId: 110771,
            balancesPath: "$.args[0].int"
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
    comptroller: "KT1FAQT239EoPCKxnb5da9ZDCEbmivNwAky6",
    interestRateModel: {
        "XTZ": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH",
        "ETH": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH",
        "BTC": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH",
        "USD": "KT1GwurQofidvhvyhqPkHMwc9ACNtQw5pMSH"
    },
    governance: "KT1HC1SDb3dYhiBFkKiHfQ6DQdBKZyRpjJUo",
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