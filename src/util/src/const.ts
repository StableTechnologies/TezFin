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
    USDT: "KT1CDs7EYthSzu5nFGrrkGf2uT7T5MaNn2NJ",
    USD: "KT1KMxnp8yWxA6vVBxAJ8iNr4YL9wq8AzdDF",
    XTZ: "KT1TieneoCTaDVevTiaFa8xv9mgk5njckggV",
    TZBTC: "KT1GCaLG77kkE1QzmtfjNigAXC2Tn19TnpNV",
  },
  fTokensReverse: {
    KT1TieneoCTaDVevTiaFa8xv9mgk5njckggV: AssetType.XTZ,
    KT1KMxnp8yWxA6vVBxAJ8iNr4YL9wq8AzdDF: AssetType.USD,
    KT1CDs7EYthSzu5nFGrrkGf2uT7T5MaNn2NJ: AssetType.USDT,
    KT1GCaLG77kkE1QzmtfjNigAXC2Tn19TnpNV: AssetType.TZBTC,
  },
  underlying: {
    USD: {
      assetType: AssetType.USD,
      address: "KT18jHYTCSvsG1mqXfm3H9suPc3bMiM1x2et",
      balancesMapId: 443827,
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
      balancesPath: "$.args[1].int",
    },
    TZBTC: {
      assetType: AssetType.TZBTC,
      address: "KT1HmTrHfXRDaeYxFF35Vt57G9CJkkSSSkvu",
      balancesMapId: 443830,
      tokenStandard: TokenStandard.FA12,
      decimals: 8,
      balancesPath: "$.args[1].int",
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1D3uH6CF3TmhpSJtTpzksqhF5SuDZ5WJvD",
      tokenId: 0,
      balancesMapId: 443822,
      balancesPath: "$.int",
    },
    XTZ: {
      assetType: AssetType.XTZ,
      tokenStandard: TokenStandard.XTZ,
      decimals: 6,
    },
  },
  comptroller: "KT1ChDPzRQiuZ1jEQv5wxPV2Eh6efTB3RRTU",
  interestRateModel: {
    XTZ: "KT1P9SdQDztKEEfC1Rh1SkoUhT7AP5LDMC52",
    USDT: "KT1J4vTq267YWwonPemBNaBKxuQgvrc2SJPp",
    USD: "KT1KWyfY6eK3En4qYQXj1cK1GHAiYy6Gt3pT",
    TZBTC: "KT1KWyfY6eK3En4qYQXj1cK1GHAiYy6Gt3pT",
  },
  governance: "KT1SMJWNkxjC5ckcadNfngcAm5YZGi3eHF14",
  oracle: "KT1JruaZp25yuKgn2DGTnCMbRoU3CaZ4M11m",
};

export const mainnetAddresses: ProtocolAddresses = {
  fTokens: {
    XTZ: "KT1MCXxbtS62tk4CUxv29BHnqTBtvsFFGzBm",
    USD: "KT1WQM7wj64GHCndwV8REccQ6N4tqZ3uRNqs",
    USDT: "KT1HCRJhfqmWKRJtZXzvTkY4iisfuR4w6pkB",
    TZBTC: "KT19gZac3vqV3ZeMJbhMX7Xy8kcocKK4Tbz1",
  },
  fTokensReverse: {
    KT1MCXxbtS62tk4CUxv29BHnqTBtvsFFGzBm: AssetType.XTZ,
    KT1WQM7wj64GHCndwV8REccQ6N4tqZ3uRNqs: AssetType.USD,
    KT1HCRJhfqmWKRJtZXzvTkY4iisfuR4w6pkB: AssetType.USDT,
    KT19gZac3vqV3ZeMJbhMX7Xy8kcocKK4Tbz1: AssetType.TZBTC,
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
  comptroller: "KT1DiWBT6RBC97iWrvLHRzKL7AWQKorBiuRG",
  interestRateModel: {
    XTZ: "KT1B7zvU7EXmPBHazHhtajHaw5swFFxWCEfd",
    USDT: "KT1Q2BBtfT9obGMAZ32L6esSjm8FG9NWiBb9",
    USD: "KT1Vzf3fXVBry4TDxWAfYzsn6ZPyMroMKUdW",
    TZBTC: "KT1Vzf3fXVBry4TDxWAfYzsn6ZPyMroMKUdW",
  },
  governance: "KT1NF6DKX5giazRTzPtEuNX1npkVcaoQkvK2",
  oracle: "KT1FU6obZqPu5S7c23R8iUzabDAuG47Jqsrm",
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
