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
        "BTC": "KT1FW8YN5kcB42QrwETBN9Tm8TgE75BNYHpP",
        "XTZ": "KT1VeuSXva7i3aae1Y3nZtSNWW2mgWMXqgQE",
        "ETH": "KT1AEFHLpUMD8CFJkH1gU2TtCCMpZJdumFfn",
        "USD": "KT18jcNXyUPTiBgEWgs2sw8DNJMGttZ5EB37",
        "WTZ": "KT1Bo6yzhCbLKE7uViSYCPdX4rrYhmqHBeXf",
        "OXTZ": "KT1WBKgbUP6PN5NSis67JDXBJuaPpJ16uf9u"
    },
    fTokensReverse: {
        KT1VeuSXva7i3aae1Y3nZtSNWW2mgWMXqgQE: AssetType.XTZ,
        KT1AEFHLpUMD8CFJkH1gU2TtCCMpZJdumFfn: AssetType.ETH,
        KT18jcNXyUPTiBgEWgs2sw8DNJMGttZ5EB37: AssetType.USD,
        KT1FW8YN5kcB42QrwETBN9Tm8TgE75BNYHpP: AssetType.BTC,
        KT1Bo6yzhCbLKE7uViSYCPdX4rrYhmqHBeXf: AssetType.WTZ,
        KT1WBKgbUP6PN5NSis67JDXBJuaPpJ16uf9u: AssetType.OXTZ
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
        "OXTZ": {
            assetType: AssetType.OXTZ,
            address: "KT1NPYBb3WMs189D25Q7PZBB2yy7Zxa6xUDu",
            balancesMapId: 167525,
            tokenStandard: TokenStandard.FA12,
            decimals: 6,
            balancesPath: "$.args[1].int"
        },
        "WTZ": {
            assetType: AssetType.WTZ,
            address: "KT1D8Sp3gq62JMPWD8t7nnKPNfLs5YXVLDZV",
            balancesMapId: 167520,
            tokenStandard: TokenStandard.FA2,
            decimals: 6,
            balancesPath: "$.int",
            tokenId: 0
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
    comptroller: "KT1AHeE4ccwhUYv8cCoZcLH3Qb1NncbjT5du",
    interestRateModel: {
        XTZ: "KT1Bkw1s6x3JFEnqNBMeF36B2QfszX3BJDJi",
        ETH: "KT1Piy5qHrEqMzh9maFwJBvbFybpA34bQRmR",
        BTC: "KT1JpWxmJkrDgxuXXVp9QcGFChRfyd9JGanN",
        USD: "KT1Piy5qHrEqMzh9maFwJBvbFybpA34bQRmR",
        OXTZ: "KT1Piy5qHrEqMzh9maFwJBvbFybpA34bQRmR",
        WTZ: "KT1JpWxmJkrDgxuXXVp9QcGFChRfyd9JGanN"
    },
    governance: "KT1MUbym8DgWvB1ty7gau2RhHQSAomYUgxo5",
    oracleMap: {
        "ETH": {
            id: 25877,
            path: "$.args[0].args[0].int"
        },
        "USD": {
            id: 167529,
            path: "$.args[1].int"
        },
        "BTC": {
            id: 25877,
            path: "$.args[0].args[0].int"
        },
        "XTZ": {
            id: 25877,
            path: "$.args[0].args[0].int"
        },
        "OXTZ": {
            id: 25877,
            path: "$.args[0].args[0].int"
        },
        "WTZ": {
            id: 25877,
            path: "$.args[0].args[0].int"
        }
    }
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