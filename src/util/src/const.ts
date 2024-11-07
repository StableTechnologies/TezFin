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
    USDT: "KT1MpaQYLKPc9xoE9pB6GZj4zbtR6Lxo6Awt",
    USD: "KT1Ni4vvfYcQXxLzFtUYr4G95TUSjMbX5XkM",
    XTZ: "KT18vuapZfMG1qYiP7qt2tTEDiokKdj77VWn",
    TZBTC: "KT1Hsbx9gw4N5y9SUHtMnfq22KQMoHBZvPmL",
  },
  fTokensReverse: {
    KT18vuapZfMG1qYiP7qt2tTEDiokKdj77VWn: AssetType.XTZ,
    KT1Ni4vvfYcQXxLzFtUYr4G95TUSjMbX5XkM: AssetType.USD,
    KT1MpaQYLKPc9xoE9pB6GZj4zbtR6Lxo6Awt: AssetType.USDT,
    KT1Hsbx9gw4N5y9SUHtMnfq22KQMoHBZvPmL: AssetType.TZBTC,
  },
  underlying: {
    USD: {
      assetType: AssetType.USD,
      address: "KT1PmfHvLcvSQAF2Hf7CCRpPHMZ6RciMWkir",
      balancesMapId: 415883,
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
      balancesPath: "$.args[1].int",
    },
    TZBTC: {
      assetType: AssetType.TZBTC,
      address: "KT1A9tgN8bPGLBRZGE6fqX7j4rvMqyjk8No2",
      balancesMapId: 420073,
      tokenStandard: TokenStandard.FA12,
      decimals: 8,
      balancesPath: "$.args[1].int",
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1E9xgz4Qze9Xk6sXebknStrTisjhz3LMgP",
      tokenId: 0,
      balancesMapId: 415878,
      balancesPath: "$.int",
    },
    XTZ: {
      assetType: AssetType.XTZ,
      tokenStandard: TokenStandard.XTZ,
      decimals: 6,
    },
  },
  comptroller: "KT1Rduo6M7kfGknEAk9syFfZjBaPEzWKF3ZU",
  interestRateModel: {
    XTZ: "KT1VZF6cD6xDsX2mRjDq78NkdKePvM8VeDaz",
    USDT: "KT1T1fed3EBdFuFCLozDz9DN46WMUDE9pvec",
    USD: "KT1PQB3ohew916tDpJHw3uJPED3oH4abMXCM",
    TZBTC: "KT1PQB3ohew916tDpJHw3uJPED3oH4abMXCM",
  },
  governance: "KT1FWtzGbfygRbMkZ7XJ72qxMcRuLuNhFF7z",
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
  oracle: "KT1DCzz5HjXi8STVN5hSLmWmqM3zNJvB7KRk",
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
