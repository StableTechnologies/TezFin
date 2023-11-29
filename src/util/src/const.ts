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
};

export const testnetAddresses: ProtocolAddresses = {
  fTokens: {
    USDT: "KT1Km26FA9iuoW8QbCie59Dd5Z15voxFjsoC",
    USD: "KT1BK9mx8xHmDWGUKThnYS9aQXmzNntA6tt2",
    XTZ: "KT1SYD6czonorQAMKhr5oTcGhto6BYc7u6ws",
  },
  fTokensReverse: {
    KT1SYD6czonorQAMKhr5oTcGhto6BYc7u6ws: AssetType.XTZ,
    KT1BK9mx8xHmDWGUKThnYS9aQXmzNntA6tt2: AssetType.USD,
    KT1Km26FA9iuoW8QbCie59Dd5Z15voxFjsoC: AssetType.USDT,
  },
  underlying: {
    USD: {
      assetType: AssetType.USD,
      address: "KT1JBqYyyX1x3t9jVoek5kK2M3g1DMpEkUmc",
      balancesMapId: 389996,
      tokenStandard: TokenStandard.FA12,
      decimals: 6,
      balancesPath: "$.args[1].int",
    },
    USDT: {
      assetType: AssetType.USDT,
      tokenStandard: TokenStandard.FA2,
      decimals: 6,
      address: "KT1KDtsFvLHhSMwyNZNaQkqqtrdYeWgjPd5K",
      tokenId: 0,
      balancesMapId: 389991,
      balancesPath: "$.int",
    },
    XTZ: {
      assetType: AssetType.XTZ,
      tokenStandard: TokenStandard.XTZ,
      decimals: 6,
    },
  },
  comptroller: "KT1BfTi4WHdiw5bFieEEPhLKut2oS7VxBi2X",
  interestRateModel: {
    XTZ: "KT1LzQVzdtxd4CSFwFLQ9ttCQ2KvAgz3iM3x",
    USDT: "KT1LAaXReVraedahgqk68dEKGqainmAuUhfm",
    USD: "KT1E9RXLcSakXgcYB4FqUm56nfJTJ7LgKUui",
  },
  governance: "KT1GKsnj6zbErQ1QdC4Tt63dUzx63722UGmX",
  oracle: "KT1SbAsDEcqy9fPyTviNhUiHKLVGbMGX9jQU",
};

export const mainnetAddresses: ProtocolAddresses = {
  fTokens: {
    XTZ: "KT1W8P4ZxD8eREKjDnxMe5882NP3GnAgrv46",
    USD: "KT1MX7D6ZJp2DDSSeDS96JPTFPXKkNiHFhwb",
    USDT: "KT1GYKoownVC1ukP2TBDgKx7bSXRM5XkV1W6",
  },
  fTokensReverse: {
    KT1W8P4ZxD8eREKjDnxMe5882NP3GnAgrv46: AssetType.XTZ,
    KT1MX7D6ZJp2DDSSeDS96JPTFPXKkNiHFhwb: AssetType.USD,
    KT1GYKoownVC1ukP2TBDgKx7bSXRM5XkV1W6: AssetType.USDT,
  },
  underlying: {
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
  comptroller: "KT1CF6EantmpPVfqdm9mDgsrMiFB2i81gcWn",
  interestRateModel: {
    XTZ: "KT1Ax6eUUbPjvdfhroH5dcEtJx4eDt8hFHcq",
    USDT: "KT1CB8zyHFvsexa5cFExD7KXGCzRQpjaMXnX",
    USD: "KT1TSYWvDnHjVj36GYdSrwCRJGEQpQoAbdMN",
  },
  governance: "KT1DBEqCQCwEtEtcJyhCfu3uxkNYp5BYU6er",
  oracle: "KT1FU6obZqPu5S7c23R8iUzabDAuG47Jqsrm",
};

export const tokenNames: { [assetType: string]: string } = {
  ETH: "ETH",
  USD: "USD",
  BTC: "BTC",
  OXTZ: "OXTZ",
  WTZ: "WTZ",
  USDT: "USDT",
};

export const expectedBlocksPerYear = 2 * 60 * 24 * 365;
