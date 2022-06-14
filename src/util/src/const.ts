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

export const testnetAddresses: ProtocolAddresses = {
    fTokens: {
        "BTC": "KT1LxnbVt3MJa2BqZhxFeXqY5xpRM4KhfF36",
        "XTZ": "KT1At9Kvci9T8M9mm9PSuuVV5Hq9ryn6Cynu",
        "ETH": "KT1Mn9oRzUTXZCkGuqDpZiFUzsjmvxip1o4u",
        "USD": "KT1RGNAMV7WTe95FyicaZzjRDcLNsZUU3PKt"
    },
    fTokensReverse: {
        KT1At9Kvci9T8M9mm9PSuuVV5Hq9ryn6Cynu: AssetType.XTZ,
        KT1Mn9oRzUTXZCkGuqDpZiFUzsjmvxip1o4u: AssetType.ETH,
        KT1RGNAMV7WTe95FyicaZzjRDcLNsZUU3PKt: AssetType.USD,
        KT1LxnbVt3MJa2BqZhxFeXqY5xpRM4KhfF36: AssetType.BTC
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
    comptroller: "KT18dvj869ZhbtVRp3mQHQdvVovHRVdknTG5",
    interestRateModel: {
        XTZ: "KT1VWpGJ5bXuPt3QPq2Bwg8at5PZhuP4MHb1",
        ETH: "KT19w4sCSmeWVoyy2HmpADfSPGM4y2rfteHR",
        BTC: "KT1VDPqzMy9XJ4fjoFuTyM61cY7CFqDRS1zR",
        USD: "KT19w4sCSmeWVoyy2HmpADfSPGM4y2rfteHR"
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

export const mainnetAddresses: ProtocolAddresses = {
    fTokens: {
        "BTC": "KT1B19pzNU1z31kExGa5VBuU8jZLXSoEdUdZ",
        "XTZ": "KT1WC7EcqpgBLAvPUYfPyqXK3VzbNyL5u7uE",
        "ETH": "KT1W9X5pycLErzEdyKoEk7gbdJzySMwwKE5y",
        "USD": "KT1Dqhd6A7qTcwZo66VuGpUwT4FG6HCwFvoN"
    },
    fTokensReverse: {
        KT1WC7EcqpgBLAvPUYfPyqXK3VzbNyL5u7uE: AssetType.XTZ,
        KT1W9X5pycLErzEdyKoEk7gbdJzySMwwKE5y: AssetType.ETH,
        KT1Dqhd6A7qTcwZo66VuGpUwT4FG6HCwFvoN: AssetType.USD,
        KT1B19pzNU1z31kExGa5VBuU8jZLXSoEdUdZ: AssetType.BTC
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
    comptroller: "KT1JpZdDmrVvDhQDaJ6jb3hKUL98ZWzE9jwk",
    interestRateModel: {
        XTZ: "KT1VWpGJ5bXuPt3QPq2Bwg8at5PZhuP4MHb1",
        ETH: "KT19w4sCSmeWVoyy2HmpADfSPGM4y2rfteHR",
        BTC: "KT1VDPqzMy9XJ4fjoFuTyM61cY7CFqDRS1zR",
        USD: "KT19w4sCSmeWVoyy2HmpADfSPGM4y2rfteHR"
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