import { AssetType, TokenStandard } from "./enum";

import { ProtocolAddresses } from "./types";

export const decimals = {
  XTZ: 6,
  ETH: 18,
  BTC: 8,
  USD: 6,
  ETHtz: 18,
  BTCtz: 8,
  USDtz: 6,
  OXTZ: 6,
  oXTZ: 6,
  WTZ: 6,
  USDT: 6,
  USDt: 6,
  tzBTC: 8,
  TZBTC: 8,
  stXTZ: 6,
  STXTZ: 6,
};

export const testnetAddresses: ProtocolAddresses = {
  fTokens: {
    USDT: "KT1ASpbBxR9iPofuyk2E1PEd3UELYwBC5oMA",
    USD: "KT1KgEk7HvkVVsD29tkot6V1EE1NWRgFgteT",
    XTZ: "KT1Wi7C2Ytr39euYaMj3V7Qx3FZsQKDqHFr3",
    TZBTC: "KT1BcaacbEMUG5P3ZNV2CqDa5G8NYEwgVad6",
    STXTZ: "KT1KjA8kJ7Egj83j9gyrxcXjisUoDPGsxqAA"
  },
  fTokensReverse: {
    KT1Wi7C2Ytr39euYaMj3V7Qx3FZsQKDqHFr3: AssetType.XTZ,
    KT1KgEk7HvkVVsD29tkot6V1EE1NWRgFgteT: AssetType.USD,
    KT1ASpbBxR9iPofuyk2E1PEd3UELYwBC5oMA: AssetType.USDT,
    KT1BcaacbEMUG5P3ZNV2CqDa5G8NYEwgVad6: AssetType.TZBTC,
    KT1KjA8kJ7Egj83j9gyrxcXjisUoDPGsxqAA: AssetType.STXTZ
  },
  underlying: {
    USD: {
      assetType: AssetType.USD,
      address: "KT1RBgHqPFPQX2TWzRAkQDqW5Fvnu3hC2FJb",
      balancesMapId: 1356,
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
      balancesPath: "$.args[0].int",
    },
    TZBTC: {
      assetType: AssetType.TZBTC,
      address: "KT1VqarPDicMFn1ejmQqqshUkUXTCTXwmkCN",
      balancesMapId: 0,
      tokenStandard: TokenStandard.FA12,
      decimals: 8,
      balancesPath: "$.args[1].int",
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1UhW3RdZ6qDMhkCbztVxFFY4eZ8uzfT5aN",
      tokenId: 0,
      balancesMapId: 1460,
      balancesPath: "$.int",
    },
    XTZ: {
      assetType: AssetType.XTZ,
      tokenStandard: TokenStandard.XTZ,
      decimals: 6,
    },
    STXTZ: {
      assetType: AssetType.STXTZ,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      tokenId: 0,
      address: "KT1WGp1JQvT3roE9YDhHw1Aq1NpY68Fvps1f",
      balancesMapId: 1488,
      balancesPath: "$.int",
    }
  },
  comptroller: "KT1WDtRBjC5whoGQw9CTf4nu5tNAVYvATp7D",
  interestRateModel: {
    XTZ: "KT1L1HHyRxVhKffYJpxwCUyt22AJmE5mRGod",
    USDT: "KT1C8Tip25C3texA2rPMD68uL7MsDPEvnRb8",
    USD: "KT1C8Tip25C3texA2rPMD68uL7MsDPEvnRb8",
    TZBTC: "KT19wZuczhw5FSAgeTkd7b98xhyCemqH8rS5",
    STXTZ: "KT1S249b8gyQx2X44oQHQtmkvDWCptciEBEF"
  },
  governance: "KT1Dv2zRviAzW4NeGdfbVWmt5jZ8vvJpRFsq",
  oracle: "KT1NwzLYM8G8rzAuUutYzZgx1TgUXCFJhxyw",
};

export const mainnetAddresses: ProtocolAddresses = {
  fTokens: {
    XTZ: "KT1Gm29ynxQcS3m6Srwd77xxMhposuNvNsRV",
    USD: "KT1DcgX4Lj1XYyB6yyg76gwpfCBaoUZsg5dE",
    USDT: "KT1HxMHg859teFpXXCZamuPiEyJa6YfHiagn",
    TZBTC: "KT1DrELZukfWQNo3J3HTUqMS9vVTjBPLT5nQ",
    STXTZ: "KT1XMtNcPze6x7hxJXezdgVGjNuHsZEYu2vw"
  },
  fTokensReverse: {
    KT1Gm29ynxQcS3m6Srwd77xxMhposuNvNsRV: AssetType.XTZ,
    KT1DcgX4Lj1XYyB6yyg76gwpfCBaoUZsg5dE: AssetType.USD,
    KT1HxMHg859teFpXXCZamuPiEyJa6YfHiagn: AssetType.USDT,
    KT1DrELZukfWQNo3J3HTUqMS9vVTjBPLT5nQ: AssetType.TZBTC,
    KT1XMtNcPze6x7hxJXezdgVGjNuHsZEYu2vw: AssetType.STXTZ
  },
  underlying: {
    TZBTC: {
      assetType: AssetType.TZBTC,
      address: "KT1PWx2mnDueood7fEmfbBDKx1D9BAnnXitn",
      balancesMapId: 31,
      tokenStandard: TokenStandard.FA12,
      decimals: 8,
      balancesPath: "$.args[1].int",
    },
    USD: {
      assetType: AssetType.USD,
      address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
      balancesMapId: 36,
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
      balancesPath: "$.args[0].int",
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o",
      tokenId: 0,
      balancesMapId: 198031,
      balancesPath: "$.int",
    },
    XTZ: {
      assetType: AssetType.XTZ,
      tokenStandard: TokenStandard.XTZ,
      decimals: 6,
    },
    STXTZ: {
      assetType: AssetType.STXTZ,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1KXKhkxDezoa8G3WvPtsrgNTs5ZQwhpYZN",
      tokenId: 0,
      balancesMapId: 729395,
      balancesPath: "$.int",
    }
  },
  comptroller: "KT1P6Lryn3ikbyf5jywWBBRP5fkztE5ZafGe",
  interestRateModel: {
    XTZ: "KT1EoQZAnsKNSkCKSRQtPBspC5ZBZJ9YoeME",
    USDT: "KT1PMLT8RaBHsKyhxGb9thRSW91Rg5G9vKQF",
    USD: "KT1PMLT8RaBHsKyhxGb9thRSW91Rg5G9vKQF",
    TZBTC: "KT1LkLYxgXqFSWTWWc2Q8HmxnrRTkv4qsXkE",
    STXTZ: "KT1AdEfMPVAJqW1uttckSSTDkTiQRK9esY3w"
  },
  governance: "KT1QScMEtDpXSuj7z2if1EMSqaXaXPnWCxqv",
  oracle: "KT1JiMMNrs6rptrQEZGCyxcZQSSZ8aqLqbYa",
};

export const tokenNames: { [assetType: string]: string } = {
  ETH: "ETH",
  USD: "USD",
  BTC: "BTC",
  OXTZ: "OXTZ",
  WTZ: "WTZ",
  USDT: "USDT",
  TZBTC: "TZBTC",
  STXTZ: "STXTZ"
};

export const expectedBlocksPerYear = 2 * 60 * 24 * 365;
