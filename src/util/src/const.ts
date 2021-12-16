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
        "XTZ": "KT1Gbc2VCqF7W5TQiGszSM49nckf9igYmj3M",
        "ETH": "KT1VGLyMmt11c4adNArXYH9dPaB7LLXoz8K5",
        "BTC": "KT1Mr7BTETa2qtEJ2Y7by1pMAfHZhzWfH2Bk"
    },
    fTokensReverse: {
        "KT1Gbc2VCqF7W5TQiGszSM49nckf9igYmj3M": AssetType.XTZ,
        "KT1VGLyMmt11c4adNArXYH9dPaB7LLXoz8K5": AssetType.ETH,
        "KT1Mr7BTETa2qtEJ2Y7by1pMAfHZhzWfH2Bk": AssetType.BTC
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
    comptroller: "KT1AD8rvgSHoM8SrNRzCVxLpDM6eKFgNH3kU",
    interestRateModel: {
        "XTZ": "KT1NRFY1vtLGh2buux35uQpabyJRsqYjSAVB",
        "ETH": "KT1R1vM6rVnR532w95E7cGAYY3rSNz8hq8fi",
        "BTC": "KT1BkEsTJDGpKugb86zdFyVm3EvuT2aeoyz6"
    },
    governance: "KT1A7VB84jAoQyqBxy5rghfvDkPaQi6XRTyp",
    priceFeed: "KT1PMQZxQTrFPJn3pEaj9rvGfJA9Hvx7Z1CL"
};

export const tokenNames: { [assetType: string]: string } = {
    "ETH": "ETH",
    "BTC": "BTC"
};

export const expectedBlocksPerYear = 2 * 60 * 24 * 365;