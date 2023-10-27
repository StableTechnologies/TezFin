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
    "OXTZ": 6,
    "oXTZ": 6,
    "WTZ": 6,
}

export const testnetAddresses: ProtocolAddresses = {
    fTokens: {
        BTC: "KT1HGmLos8GJuLhU6L5oXY3QJZyzgj8KtSvf",
        XTZ: "KT1TNYmoKmEDeCsVSLgjsrXRREgy3E3TWn1w",
        ETH: "KT1W3ToWo2zAAFcJKL2ejif6YyUZY4gkSaT7",
        USD: "KT1Wd59GWzaRBTwwc5UeetvsrKeaW83YZC3h",
        WTZ: "KT1KFEe4YMGaxRgFkWeEqfTriuxL5HpuABtC",
        OXTZ: "KT1U8K7FgzrFLpzDYaZfVjVPFJw49frQ4fw6",
    },
    fTokensReverse: {
        KT1TNYmoKmEDeCsVSLgjsrXRREgy3E3TWn1w: AssetType.XTZ,
        KT1W3ToWo2zAAFcJKL2ejif6YyUZY4gkSaT7: AssetType.ETH,
        KT1Wd59GWzaRBTwwc5UeetvsrKeaW83YZC3h: AssetType.USD,
        KT1HGmLos8GJuLhU6L5oXY3QJZyzgj8KtSvf: AssetType.BTC,
        KT1KFEe4YMGaxRgFkWeEqfTriuxL5HpuABtC: AssetType.WTZ,
        KT1U8K7FgzrFLpzDYaZfVjVPFJw49frQ4fw6: AssetType.OXTZ,
    },
    underlying: {
        ETH: {
            assetType: AssetType.ETH,
            tokenStandard: TokenStandard.FA12,
            decimals: 18,
            address: "KT1DADeY8SkaXYfYXqzCD7ZMiyCtvArgjHsN",
            balancesMapId: 378570,
            balancesPath: "$.args[1].int",
        },
        USD: {
            assetType: AssetType.USD,
            address: "KT1UMyZmnW4MGsLZuPYfGCha3PansY1J18TS",
            balancesMapId: 378573,
            tokenStandard: TokenStandard.FA12,
            decimals: 6,
            balancesPath: "$.args[1].int",
        },
        OXTZ: {
            assetType: AssetType.OXTZ,
            address: "KT1T8AJAoc2uDRqQZ3y2JRiQe5DouT4jmY3t",
            balancesMapId: 378581,
            tokenStandard: TokenStandard.FA12,
            decimals: 6,
            balancesPath: "$.args[1].int",
        },
        WTZ: {
            assetType: AssetType.WTZ,
            address: "KT1JYMN4q5oUUjSfYqHMeMVAr1hW8ef9yyFm",
            balancesMapId: 378576,
            tokenStandard: TokenStandard.FA2,
            decimals: 6,
            balancesPath: "$.int",
            tokenId: 0,
        },
        BTC: {
            assetType: AssetType.BTC,
            tokenStandard: TokenStandard.FA2,
            decimals: 8,
            address: "KT1MMgu7iv1DhwVi23RDFa4qCrUFTaZgn7ND",
            tokenId: 0,
            balancesMapId: 378565,
            balancesPath: "$.int",
        },
        XTZ: {
            assetType: AssetType.XTZ,
            tokenStandard: TokenStandard.XTZ,
            decimals: 6,
        },
    },
    comptroller: "KT1TZvVK5kkJb4KnLSYmv3RsTzoR85xar4py",
    interestRateModel: {
        XTZ: "KT1T1AWvaSs6Tf8fqJHTmKyWdWpBKZLhLBEt",
        ETH: "KT1Vzz6aRLSEw3cCpUMFCvEijAL3Q5yTf52Z",
        BTC: "KT1F8o1yGu3k9GGL8dj3v1c1bVk6J5SyRnhW",
        USD: "KT1Vzz6aRLSEw3cCpUMFCvEijAL3Q5yTf52Z",
        OXTZ: "KT1Vzz6aRLSEw3cCpUMFCvEijAL3Q5yTf52Z",
        WTZ: "KT1F8o1yGu3k9GGL8dj3v1c1bVk6J5SyRnhW",
    },
    governance: "KT1PKfuMKy9vYbWs7mZ4gUzioZeNVBtjxMZB",
    oracleMap: {
        ETH: {
            id: 25877,
            path: "$.args[0].args[0].int",
        },
        USD: {
            id: 378585,
            path: "$.args[1].int",
        },
        BTC: {
            id: 25877,
            path: "$.args[0].args[0].int",
        },
        XTZ: {
            id: 25877,
            path: "$.args[0].args[0].int",
        },
        OXTZ: {
            id: 25877,
            path: "$.args[0].args[0].int",
        },
        WTZ: {
            id: 25877,
            path: "$.args[0].args[0].int",
        },
    },
};

export const mainnetAddresses: ProtocolAddresses = {
    fTokens: {
        "BTC": "KT1M9LQ2twkcz5gVwvX8toCN69oEMytERhZr",
        "XTZ": "KT1AMZChmZuQ7WM3imknJJhkmeXxRFrZ6uWu",
        "ETH": "KT1LxPGwkrvj8gG8k8CkpyKQaWyQAsnLfHLg",
        "USD": "KT1AfDTR1CFo9L7PMdw643BUjn2dyaHsueDt",
        "WTZ": "KT1F2HLNv4ev4U45fWMvAR5rUxPScdSZMvXK",
        "OXTZ": "KT1TJnggKeM4ZhjW5KtWHswfyZ3yYNst53LZ"
    },
    fTokensReverse: {
        KT1AMZChmZuQ7WM3imknJJhkmeXxRFrZ6uWu: AssetType.XTZ,
        KT1LxPGwkrvj8gG8k8CkpyKQaWyQAsnLfHLg: AssetType.ETH,
        KT1AfDTR1CFo9L7PMdw643BUjn2dyaHsueDt: AssetType.USD,
        KT1M9LQ2twkcz5gVwvX8toCN69oEMytERhZr: AssetType.BTC,
        KT1F2HLNv4ev4U45fWMvAR5rUxPScdSZMvXK: AssetType.WTZ,
        KT1TJnggKeM4ZhjW5KtWHswfyZ3yYNst53LZ: AssetType.OXTZ
    },
    underlying: {
        "ETH": {
            assetType: AssetType.ETH,
            tokenStandard: TokenStandard.FA12,
            decimals: 18,
            address: "KT19at7rQUvyjxnZ2fBv7D9zc8rkyG7gAoU8",
            balancesMapId: 199,
            balancesPath: "$.args[0].int"
        },
        "USD": {
            assetType: AssetType.USD,
            address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
            balancesMapId: 36,
            tokenStandard: TokenStandard.FA12,
            decimals: 6,
            balancesPath: "$.args[0].int"
        },
        "OXTZ": {
            assetType: AssetType.OXTZ,
            address: "KT1TjnZYs5CGLbmV6yuW169P8Pnr9BiVwwjz",
            balancesMapId: 103270,
            tokenStandard: TokenStandard.FA12,
            decimals: 6,
            balancesPath: "$.args[1].int"
        },
        "WTZ": {
            assetType: AssetType.WTZ,
            address: "KT1PnUZCp3u2KzWr93pn4DD7HAJnm3rWVrgn",
            balancesMapId: 19486,
            tokenStandard: TokenStandard.FA2,
            decimals: 6,
            tokenId: 0,
            balancesPath: "$.int"
        },
        "BTC": {
            assetType: AssetType.BTC,
            tokenStandard: TokenStandard.FA2,
            decimals: 8,
            address: "KT1T87QbpXEVgkwsNPzz8iRoah3SS3D1MDmh",
            tokenId: 0,
            balancesMapId: 24117,
            balancesPath: "$.int"
        },
        "XTZ": {
            assetType: AssetType.XTZ,
            tokenStandard: TokenStandard.XTZ,
            decimals: 6
        }
    },
    comptroller: "KT1XnZqyGrEKkf8TiQ2uYE2zyxsp2L5NZ6KW",
    interestRateModel: {
        XTZ: "KT1AtJQgU4zEp2wgyWRK7DqdDiPkWBodNiwz",
        ETH: "KT1QCL5W3heju7SJKvRgYR9xNtP9fEenG1Eq",
        BTC: "KT1P7GJRN5Tx8YDn4YS7Ao5UWApM2Asxk4Ty",
        USD: "KT1QCL5W3heju7SJKvRgYR9xNtP9fEenG1Eq",
        OXTZ: "KT1QCL5W3heju7SJKvRgYR9xNtP9fEenG1Eq",
        WTZ: "KT1P7GJRN5Tx8YDn4YS7Ao5UWApM2Asxk4Ty"

    },
    governance: "KT1KW6McQpHFZPffW6vZt5JSxibvVKAPnYUq",
    oracleMap: {
        "ETH": {
            id: 47917,
            path: "$.args[0].args[0].int"
        },
        "USD": {
            id: 256774,
            path: "$.args[1].int"
        },
        "BTC": {
            id: 47917,
            path: "$.args[0].args[0].int"
        },
        "XTZ": {
            id: 47917,
            path: "$.args[0].args[0].int"
        },
        "WTZ": {
            id: 47917,
            path: "$.args[0].args[0].int"
        },
        "OXTZ": {
            id: 47917,
            path: "$.args[0].args[0].int"
        }
    }
};

export const tokenNames: { [assetType: string]: string } = {
    "ETH": "ETH",
    "USD": "USD",
    "BTC": "BTC",
    "OXTZ": "OXTZ",
    "WTZ": "WTZ",
};

export const expectedBlocksPerYear = 2 * 60 * 24 * 365;