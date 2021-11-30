import { AssetType, TokenStandard } from './enum';

import { ProtocolAddresses } from './types';

export const granadanetAddresses: ProtocolAddresses = {
    fTokens: {
        "XTZ": "KT1ASC5RdufbWnFYmjuRrceXedRBSUJogdTb",
        "ETH": "KT1UoXhx4WR7iVH3iJqSC5Md9SsNYcuFag94",
        "BTC": "KT1V6CQpfxS5pRjkUzoPx5Qmi7dSBnxdWshd"
    },
    fTokensReverse: {
        "KT1ASC5RdufbWnFYmjuRrceXedRBSUJogdTb": AssetType.XTZ,
        "KT1UoXhx4WR7iVH3iJqSC5Md9SsNYcuFag94": AssetType.ETH,
        "KT1V6CQpfxS5pRjkUzoPx5Qmi7dSBnxdWshd": AssetType.BTC
    },
    underlying: {
        "ETH": {
            assetType: AssetType.ETH,
            tokenStandard: TokenStandard.FA12,
            decimals: 18,
            address: "KT1LLL2RWrc4xi23umbq1564ej88RG6LcAoR",
            balancesMapId: 135623,
            balancesPath: "$.args[1].int"
        },
        "BTC": {
            assetType: AssetType.BTC,
            tokenStandard: TokenStandard.FA2,
            decimals: 8,
            address: "KT1SM4x48cbemJaipLqRGZgbwfWukZEdz4jw",
            tokenId: 0,
            balancesMapId: 135627,
            balancesPath: "$.int"

        },
        "XTZ": {
            assetType: AssetType.XTZ,
            tokenStandard: TokenStandard.XTZ,
            decimals: 6
        }
    },
    comptroller: "KT1XfLzhqDt6qQj22RvdTdbVWFUMLQPUGzut",
    interestRateModel: {
        "XTZ": "KT1BxbwBgSAopMh17bj5UKmgbi78DsptXitc",
        "ETH": "KT1XLYihVvuJKk4VJZVGdnPv4eo9CEEDpfHA",
        "BTC": "KT1TYqwzPHMwreTPGBYXVnQFgi1hDH1Fa4ge"
    },
    governance: "KT1UUZNzmqobhGXYvsbWUjnAAeWK3de2JG2q",
    priceFeed: "KT1MwuujtBodVQFm1Jk1KTGNc49wygqoLvpe"
};

export const tokenNames: { [assetType: string]: string } = {
    "ETH": "ETH",
    "BTC": "BTC"
};

export const expectedBlocksPerYear = 2 * 60 * 24 * 365;