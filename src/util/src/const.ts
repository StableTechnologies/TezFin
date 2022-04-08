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
        "BTC": "KT1WS9wxA8SPw3YZQSiu2MbAmgGkQCm5Qwdv",
        "XTZ": "KT1Ls44WK9uycR41rMvwTiAVNsRCfgMiCyft",
        "ETH": "KT1WkkQmWssgLiEKUqVY1cAgyxddhQzsTCSi",
        "USD": "KT1R9RDqwa1iYUEp4mPo2xFUvZYLCBGCmQfd"
    },
    fTokensReverse: {
        "KT1Ls44WK9uycR41rMvwTiAVNsRCfgMiCyft": AssetType.XTZ,
        "KT1WkkQmWssgLiEKUqVY1cAgyxddhQzsTCSi": AssetType.ETH,
        "KT1R9RDqwa1iYUEp4mPo2xFUvZYLCBGCmQfd": AssetType.USD,
        "KT1WS9wxA8SPw3YZQSiu2MbAmgGkQCm5Qwdv": AssetType.BTC
    },
    underlying: {
        "ETH": {
            assetType: AssetType.ETH,
            tokenStandard: TokenStandard.FA12,
            decimals: 18,
            address: "KT1AAfsTHPnWT5cU77CUNQ2dcQNtAJ1jauPC",
            balancesMapId: 34651,
            balancesPath: "$.args[1].int"
        },
        "USD": {
            assetType: AssetType.USD,
            address: "KT1XA22D7DazGGefGVGyWHH9Y2MTFmiPjxq3",
            balancesMapId: 34654,
            tokenStandard: TokenStandard.FA12,
            decimals: 6,
            balancesPath: "$.args[1].int"
        },
        "BTC": {
            assetType: AssetType.BTC,
            tokenStandard: TokenStandard.FA2,
            decimals: 8,
            address: "KT1D11fEJQuUGn4m161mHmZ7Lkayzq4Cv6xW",
            tokenId: 0,
            balancesMapId: 34646,
            balancesPath: "$.int"
        },
        "XTZ": {
            assetType: AssetType.XTZ,
            tokenStandard: TokenStandard.XTZ,
            decimals: 6
        }
    },
    comptroller: "KT1AZHZwsyRh8JqLoKf1by5Nngty7zLUxnyC",
    interestRateModel: {
        "XTZ": "KT1Fpg2mmLQji79fMh4RXU9hDnHSx4YoNHUw",
        "ETH": "KT1Fpg2mmLQji79fMh4RXU9hDnHSx4YoNHUw",
        "BTC": "KT1Fpg2mmLQji79fMh4RXU9hDnHSx4YoNHUw",
        "USD": "KT1Fpg2mmLQji79fMh4RXU9hDnHSx4YoNHUw"
    },
    governance: "KT1MUbym8DgWvB1ty7gau2RhHQSAomYUgxo5",
    oracleMap: {
        "ETH": {
            id: 25877,
            path: "$.args[0].args[0].int"
        },
        "USD": {
            id: 34657,
            path: "$.args[1].int"
        },
        "BTC": {
            id: 25877,
            path: "$.args[0].args[0].int"
        },
        "XTZ": {
            id: 25877,
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