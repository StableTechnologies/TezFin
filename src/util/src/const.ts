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
        "BTC": "KT1LfEC7rMHiGMt42C82s39mNgCgZEA58Ksm",
        "XTZ": "KT1RLDaDsWpgiGeFXurdfZ4BS8q1WV2db82N",
        "ETH": "KT1QTwq7rTsRN1fNa8TaCMmZmCtQzCQ3TtaM",
        "USD": "KT1PiFskuFeBLQjAwk7nK9hhZ1x48U8koZBu"
    },
    fTokensReverse: {
        "KT1RLDaDsWpgiGeFXurdfZ4BS8q1WV2db82N": AssetType.XTZ,
        "KT1QTwq7rTsRN1fNa8TaCMmZmCtQzCQ3TtaM": AssetType.ETH,
        "KT1PiFskuFeBLQjAwk7nK9hhZ1x48U8koZBu": AssetType.USD,
        "KT1LfEC7rMHiGMt42C82s39mNgCgZEA58Ksm": AssetType.BTC
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
    comptroller: "KT1WgqEXJwuqz45tc4f2VyVMS3tdrLYm3mP1",
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