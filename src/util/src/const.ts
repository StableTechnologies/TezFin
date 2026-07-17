import { AssetType, TokenStandard } from "./enum";

import { Network, ProtocolAddresses } from "./types";

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
    },
    TZBTC: {
      assetType: AssetType.TZBTC,
      address: "KT1VqarPDicMFn1ejmQqqshUkUXTCTXwmkCN",
      balancesMapId: 0,
      tokenStandard: TokenStandard.FA12,
      decimals: 8,
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1UhW3RdZ6qDMhkCbztVxFFY4eZ8uzfT5aN",
      tokenId: 0,
      balancesMapId: 1460,
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
  network: Network.Shadownet
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
      tokenStandard: TokenStandard.FA12_PACKED,
      decimals: 8,
    },
    USD: {
      assetType: AssetType.USD,
      address: "KT1LN4LPSqTMS7Sd2CJw4bbDGRkMv2t68Fy9",
      balancesMapId: 36,
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1XnTn74bUtxHfDtBmm2bGZAQfhPbvKWR8o",
      tokenId: 0,
      balancesMapId: 198031,
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
    }
  },
  comptroller: "KT1TqVTu1tj5srznevEZtN7141oje5Fdf7gh",
  comptrollerDataSource: "KT1P6Lryn3ikbyf5jywWBBRP5fkztE5ZafGe",
  interestRateModel: {
    XTZ: "KT1NnUwvf3TqF8PaiGNJ6mFvVxb2of3XQyT9",
    USDT: "KT1PMLT8RaBHsKyhxGb9thRSW91Rg5G9vKQF",
    USD: "KT1PMLT8RaBHsKyhxGb9thRSW91Rg5G9vKQF",
    TZBTC: "KT1LkLYxgXqFSWTWWc2Q8HmxnrRTkv4qsXkE",
    STXTZ: "KT1AdEfMPVAJqW1uttckSSTDkTiQRK9esY3w"
  },
  governance: "KT1QScMEtDpXSuj7z2if1EMSqaXaXPnWCxqv",
  oracle: "KT1JiMMNrs6rptrQEZGCyxcZQSSZ8aqLqbYa",
  network: Network.Mainnet
};

export const previewnetAddresses: ProtocolAddresses = {
  fTokens: {
    XTZ:   "KT1Be9KLArJuSwWGiqxHP7YtpsHUtXzKMzXK",
    USDT:  "KT1AR3ME1Ag4Hkod6e9bVP5fmRXecu88h7QJ",
    USD:   "KT1QQBo5mTdCSnk66kNS53hGzQxknRxz9VWT",
    STXTZ: "KT1MpVTLYnN9W5pbTFu2nUv6JoNfKA4VfUnm",
  },
  fTokensReverse: {
    KT1Be9KLArJuSwWGiqxHP7YtpsHUtXzKMzXK: AssetType.XTZ,
    KT1AR3ME1Ag4Hkod6e9bVP5fmRXecu88h7QJ: AssetType.USDT,
    KT1QQBo5mTdCSnk66kNS53hGzQxknRxz9VWT: AssetType.USD,
    KT1MpVTLYnN9W5pbTFu2nUv6JoNfKA4VfUnm: AssetType.STXTZ,
  },
  underlying: {
    USD: {
      assetType: AssetType.USD,
      address: "KT1Ho6NbeyyGExTcq74VAEh4vwis51AXrE16",
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1QC9jwGx6oUDFiTVDY97rbsHc3UDuBPJBH",
      tokenId: 0,
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
      address: "KT1ENE6cK3PAJDWs5VF8KCzRTihPnywu4waE",
      tokenId: 0,
    },
  },
  comptroller: "KT1DxrZ8vLgqTFqiNWD5GLTeMiYrtBWF2vgt",
  interestRateModel: {
    XTZ:   "KT1X2U77419s1ReGnD9jxNTKwJbu4f73AhS2",
    USDT:  "KT19rD2vyYv8Szak1qtSUxMgJ5B3kbdMWJgV",
    USD:   "KT1VwACD1FADmTeWqVUCY4R2XNGmEJx5cGzm",
    STXTZ: "KT1T5ht1i3QHBkVuprk9VRL7tusqpB3HvTGA",
  },
  governance: "KT1GNcDLmXBV15dUbydBUptsoARvTGNFa9sq",
  oracle: "KT1Ks7c9RGiA8MVUniXDzfrSy2KpobNC8UgC",
  network: Network.Previewnet,
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

export const blocksPerMinute: Record<Network, number> = {
  mainnet: 10,
  shadownet: 10,
  "tezosx-previewnet": 120,
};
