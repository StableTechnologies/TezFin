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
};

export const testnetAddresses: ProtocolAddresses = {
  fTokens: {
    USDT: "KT1P51AJbS1iBvAXstqsPv4UJeQ8fGCZbS7P",
    USD: "KT1QtSBzy61AmUcsjqQbMSdnr1ifP9RQ2Zug",
    XTZ: "KT1CC4E5zmbJm94VwLf7ZEoJvC2tEqzE8Pqp",
    TZBTC: "KT1JrHK7S9zZ5bA1xTBxNnkieM9YL7iq1KdB",
  },
  fTokensReverse: {
    KT1CC4E5zmbJm94VwLf7ZEoJvC2tEqzE8Pqp: AssetType.XTZ,
    KT1QtSBzy61AmUcsjqQbMSdnr1ifP9RQ2Zug: AssetType.USD,
    KT1P51AJbS1iBvAXstqsPv4UJeQ8fGCZbS7P: AssetType.USDT,
    KT1JrHK7S9zZ5bA1xTBxNnkieM9YL7iq1KdB: AssetType.TZBTC,
  },
  underlying: {
    USD: {
      assetType: AssetType.USD,
      address: "KT1WatnVAD7GSdZZrQVm1oMgEnqPCnKNuqrn",
      balancesMapId: 468865,
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
      balancesPath: "$.args[1].int",
    },
    TZBTC: {
      assetType: AssetType.TZBTC,
      address: "KT1DSBWogEEkLyk9UysA9p91v7xPvzV18Vu7",
      balancesMapId: 468862,
      tokenStandard: TokenStandard.FA12,
      decimals: 8,
      balancesPath: "$.args[1].int",
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1Rr8vMLzQ4BQghUjGZerB5WrV1hTtVjtUb",
      tokenId: 0,
      balancesMapId: 468868,
      balancesPath: "$.int",
    },
    XTZ: {
      assetType: AssetType.XTZ,
      tokenStandard: TokenStandard.XTZ,
      decimals: 6,
    },
  },
  comptroller: "KT1R2sHBKvaja5ZVZzLv5VcoAUNfSYoYFDrX",
  interestRateModel: {
    XTZ: "KT1XNBkP1irKJgC1DGWFqD8Je1tdcoyuDoha",
    USDT: "KT1XNBkP1irKJgC1DGWFqD8Je1tdcoyuDoha",
    USD: "KT1XNBkP1irKJgC1DGWFqD8Je1tdcoyuDoha",
    TZBTC: "KT1XNBkP1irKJgC1DGWFqD8Je1tdcoyuDoha",
  },
  governance: "KT1ELnYzaxQBULdfJXBc7iAVfudd4ktqvdhA",
  oracle: "KT1JruaZp25yuKgn2DGTnCMbRoU3CaZ4M11m",
};

export const mainnetAddresses: ProtocolAddresses = {
  fTokens: {
    XTZ: "KT1Gm29ynxQcS3m6Srwd77xxMhposuNvNsRV",
    USD: "KT1DcgX4Lj1XYyB6yyg76gwpfCBaoUZsg5dE",
    USDT: "KT1HxMHg859teFpXXCZamuPiEyJa6YfHiagn",
    TZBTC: "KT1DrELZukfWQNo3J3HTUqMS9vVTjBPLT5nQ",
  },
  fTokensReverse: {
    KT1Gm29ynxQcS3m6Srwd77xxMhposuNvNsRV: AssetType.XTZ,
    KT1DcgX4Lj1XYyB6yyg76gwpfCBaoUZsg5dE: AssetType.USD,
    KT1HxMHg859teFpXXCZamuPiEyJa6YfHiagn: AssetType.USDT,
    KT1DrELZukfWQNo3J3HTUqMS9vVTjBPLT5nQ: AssetType.TZBTC,
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
  },
  comptroller: "KT1P6Lryn3ikbyf5jywWBBRP5fkztE5ZafGe",
  interestRateModel: {
    XTZ: "KT1MouCFViyqWQ3QX5Zk69JGnXBXjQso68sy",
    USDT: "KT1MouCFViyqWQ3QX5Zk69JGnXBXjQso68sy",
    USD: "KT1MouCFViyqWQ3QX5Zk69JGnXBXjQso68sy",
    TZBTC: "KT1MouCFViyqWQ3QX5Zk69JGnXBXjQso68sy",
  },
  governance: "KT1QScMEtDpXSuj7z2if1EMSqaXaXPnWCxqv",
  oracle: "KT1Wey5KJSanEkVvLf3ngQcMiBqF9Sn2FEic",
};

export const tokenNames: { [assetType: string]: string } = {
  ETH: "ETH",
  USD: "USD",
  BTC: "BTC",
  OXTZ: "OXTZ",
  WTZ: "WTZ",
  USDT: "USDT",
  TZBTC: "TZBTC",
};

export const expectedBlocksPerYear = 2 * 60 * 24 * 365;
