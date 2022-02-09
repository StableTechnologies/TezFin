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
        "BTC": "KT1XQuJmEa9n9xRK5rPBSwRD31vh1pqXBd2r",
        "XTZ": "KT1XoC1kqi97ZrHBvy5VrgzKNUmH7LhWbWWi",
        "ETH": "KT1QAHeKPUXkcKQ25TXCYo2XS3VHs3JCZ1qS",
        "USD": "KT1DeE8DtjW3xu6KTNLm5YTwg7GzZYbogaj3"
    },
    fTokensReverse: {
        "KT1XoC1kqi97ZrHBvy5VrgzKNUmH7LhWbWWi": AssetType.XTZ,
        "KT1QAHeKPUXkcKQ25TXCYo2XS3VHs3JCZ1qS": AssetType.ETH,
        "KT1DeE8DtjW3xu6KTNLm5YTwg7GzZYbogaj3": AssetType.USD,
        "KT1XQuJmEa9n9xRK5rPBSwRD31vh1pqXBd2r": AssetType.BTC
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
    comptroller: "KT1MndSifWNCajEiayw84oK5MxS9AfRpmLc2",
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