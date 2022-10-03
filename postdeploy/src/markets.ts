import { MarketMap} from 'tezoslendingplatformjs';
export const marketTestData: any = {
  "USD": {
    "currentPrice": "1000000",
    "address": "KT1MmJM5Uqr9GM7MhKexmN6XMSBWs1RUwx8s",
    "asset": {
      "name": "USD",
      "underlying": {
        "assetType": "USD",
        "address": "KT1XnPKG975rvfhiGtBBx71YTzu7m7YkEZAa",
        "balancesMapId": 170241,
        "tokenStandard": 1,
        "decimals": 6,
        "balancesPath": "$.args[1].int"
      },
      "administrator": "KT1U6xDZ2TGQcR7XU7wnvvL1JKEvLhC96pgg",
      "price": "0"
    },
    "cash": "0",
    "cashUsd": "0",
    "supply": {
      "numParticipants": 0,
      "totalAmount": "20000000000",
      "rate": "0"
    },
    "borrow": {
      "numParticipants": 0,
      "totalAmount": "0",
      "rate": "99999999955728000"
    },
    "dailyInterestPaid": "0",
    "reserves": "0",
    "reserveFactor": 5e+16,
    "collateralFactor": "500000000000000000",
    "exchangeRate": "1",
    "storage": {
      "accrualBlockNumber": "1140973",
      "administrator": "KT1U6xDZ2TGQcR7XU7wnvvL1JKEvLhC96pgg",
      "balancesMapId": "17055",
      "supply": {
        "totalSupply": "20000000000",
        "supplyRatePerBlock": "0"
      },
      "borrow": {
        "totalBorrows": "0",
        "borrowIndex": "1000000011407711640",
        "borrowRateMaxMantissa": "80000000000",
        "borrowRatePerBlock": "0"
      },
      "protocolSeizeShareMantissa": "100000000000000",
      "comptrollerAddress": "KT1JyRWJd6u8mEtY9s5AsH3FJiwJgCtxRp6p",
      "expScale": "1000000000000000000",
      "halfExpScale": "500000000000000000",
      "initialExchangeRateMantissa": "1000000000000000000",
      "interestRateModel": "KT1KgQ5ayRxSohKgNtzB3vbTRFwC8GGHL8u6",
      "reserveFactorMantissa": "50000000000000000",
      "reserveFactorMaxMantissa": "1000000000000000000",
      "totalReserves": "0",
      "currentCash": "20000000000"
    },
    "rateModel": {
      "blockRate": "950642634",
      "blockMultiplier": "76000000000",
      "scale": "1000000000000000000"
    }
  },
  "ETH": {
    "currentPrice": "2000000000",
    "address": "KT1DdUFD6XYEF3N7fqrSUeRy4XAba2ioSqqM",
    "asset": {
      "name": "ETH",
      "underlying": {
        "assetType": "ETH",
        "tokenStandard": 1,
        "decimals": 18,
        "address": "KT1Rp3Z1p7ugLJNccAsGjdxUAYHMrt5itT4h",
        "balancesMapId": 170238,
        "balancesPath": "$.args[1].int"
      },
      "administrator": "KT1U6xDZ2TGQcR7XU7wnvvL1JKEvLhC96pgg",
      "price": "0"
    },
    "cash": "0",
    "cashUsd": "0",
    "supply": {
      "numParticipants": 0,
      "totalAmount": "6000000000000000000",
      "rate": "0"
    },
    "borrow": {
      "numParticipants": 0,
      "totalAmount": "0",
      "rate": "99999999955728000"
    },
    "dailyInterestPaid": "0",
    "reserves": "0",
    "reserveFactor": 5e+16,
    "collateralFactor": "500000000000000000",
    "exchangeRate": "1",
    "storage": {
      "accrualBlockNumber": "1140973",
      "administrator": "KT1U6xDZ2TGQcR7XU7wnvvL1JKEvLhC96pgg",
      "balancesMapId": "170253",
      "supply": {
        "totalSupply": "6000000000000000000",
        "supplyRatePerBlock": "0"
      },
      "borrow": {
        "totalBorrows": "3000000000000000000",
        "borrowIndex": "1000000011407711640",
        "borrowRateMaxMantissa": "80000000000",
        "borrowRatePerBlock": "0"
      },
      "protocolSeizeShareMantissa": "100000000000000",
      "comptrollerAddress": "KT1JyRWJd6u8mEtY9s5AsH3FJiwJgCtxRp6p",
      "expScale": "1000000000000000000",
      "halfExpScale": "500000000000000000",
      "initialExchangeRateMantissa": "1000000000000000000",
      "interestRateModel": "KT1KgQ5ayRxSohKgNtzB3vbTRFwC8GGHL8u6",
      "reserveFactorMantissa": "50000000000000000",
      "reserveFactorMaxMantissa": "1000000000000000000",
      "totalReserves": "0",
      "currentCash": "6000000000000000000"
    },
    "rateModel": {
      "blockRate": "950642634",
      "blockMultiplier": "76000000000",
      "scale": "1000000000000000000"
    }
  },
  "BTC": {
    "currentPrice": "20000000000",
    "address": "KT1FYUXdqYCcFn1AfSkx8BxTEhdMsRuqi788",
    "asset": {
      "name": "BTC",
      "underlying": {
        "assetType": "BTC",
        "tokenStandard": 2,
        "decimals": 8,
        "address": "KT1EKZK4w61kH7Z6LxjQHwDKMYZTXstc8Y2x",
        "tokenId": 0,
        "balancesMapId": 170233,
        "balancesPath": "$.int"
      },
      "administrator": "KT1U6xDZ2TGQcR7XU7wnvvL1JKEvLhC96pgg",
      "price": "0"
    },
    "cash": "0",
    "cashUsd": "0",
    "supply": {
      "numParticipants": 0,
      "totalAmount": "600000000",
      "rate": "0"
    },
    "borrow": {
      "numParticipants": 0,
      "totalAmount": "0",
      "rate": "99999999955728000"
    },
    "dailyInterestPaid": "0",
    "reserves": "0",
    "reserveFactor": 5e+16,
    "collateralFactor": "500000000000000000",
    "exchangeRate": "1",
    "storage": {
      "accrualBlockNumber": "1140973",
      "administrator": "KT1U6xDZ2TGQcR7XU7wnvvL1JKEvLhC96pgg",
      "balancesMapId": "170251",
      "supply": {
        "totalSupply": "600000000",
        "supplyRatePerBlock": "0"
      },
      "borrow": {
        "totalBorrows": "0",
        "borrowIndex": "1000000011407711640",
        "borrowRateMaxMantissa": "80000000000",
        "borrowRatePerBlock": "0"
      },
      "protocolSeizeShareMantissa": "100000000000000",
      "comptrollerAddress": "KT1JyRWJd6u8mEtY9s5AsH3FJiwJgCtxRp6p",
      "expScale": "1000000000000000000",
      "halfExpScale": "500000000000000000",
      "initialExchangeRateMantissa": "1000000000000000000",
      "interestRateModel": "KT1KsyNutv9pqT3Key49ocrmaxaVnLrWRtrv",
      "reserveFactorMantissa": "50000000000000000",
      "reserveFactorMaxMantissa": "1000000000000000000",
      "totalReserves": "0",
      "currentCash": "600000000"
    },
    "rateModel": {
      "blockRate": "950642634",
      "blockMultiplier": "76000000000",
      "scale": "1000000000000000000"
    }
  }
};

export const ftokenTestData = {
	ETH: {
		accrualBlockNumber: "1257893",
		administrator: "KT1M6zHVmMXs4qPwH55U56Kzj2aHgu1we5zN",
		balancesMapId: "179419",
		supply: {
			totalSupply: "12000000000000000000",
			supplyRatePerBlock: "0",
		},
		borrow: {
			totalBorrows: "0",
			borrowIndex: "1000001066621078961",
			borrowRateMaxMantissa: "80000000000",
			borrowRatePerBlock: "0",
		},
		protocolSeizeShareMantissa: "100000000000000",
		comptrollerAddress: "KT1BQu66KEYqBuKB14sgQHrPgqGtuqy9LFxy",
		expScale: "1000000000000000000",
		halfExpScale: "500000000000000000",
		initialExchangeRateMantissa: "1000000000000000000",
		interestRateModel: "KT1MSpyz3t9QwtgrR5aF62JFrCqSSNdwyqXX",
		reserveFactorMantissa: "50000000000000000",
		reserveFactorMaxMantissa: "1000000000000000000",
		totalReserves: "0",
		currentCash: "12000000000000000000",
	},
	BTC: {
		accrualBlockNumber: "1257893",
		administrator: "KT1M6zHVmMXs4qPwH55U56Kzj2aHgu1we5zN",
		balancesMapId: "179417",
		supply: { totalSupply: "1200000000", supplyRatePerBlock: "0" },
		borrow: {
			totalBorrows: "0",
			borrowIndex: "1000001066621078961",
			borrowRateMaxMantissa: "80000000000",
			borrowRatePerBlock: "0",
		},
		protocolSeizeShareMantissa: "100000000000000",
		comptrollerAddress: "KT1BQu66KEYqBuKB14sgQHrPgqGtuqy9LFxy",
		expScale: "1000000000000000000",
		halfExpScale: "500000000000000000",
		initialExchangeRateMantissa: "1000000000000000000",
		interestRateModel: "KT1N4KrTxEpoRqpqsSDV2gd8iRNM7jD7En1A",
		reserveFactorMantissa: "50000000000000000",
		reserveFactorMaxMantissa: "1000000000000000000",
		totalReserves: "0",
		currentCash: "1200000000",
	},
	USD: {
		accrualBlockNumber: "1257893",
		administrator: "KT1M6zHVmMXs4qPwH55U56Kzj2aHgu1we5zN",
		balancesMapId: "179421",
		supply: { totalSupply: "40000000000", supplyRatePerBlock: "0" },
		borrow: {
			totalBorrows: "1300000027",
			borrowIndex: "1000001088682272766",
			borrowRateMaxMantissa: "80000000000",
			borrowRatePerBlock: "0",
		},
		protocolSeizeShareMantissa: "100000000000000",
		comptrollerAddress: "KT1BQu66KEYqBuKB14sgQHrPgqGtuqy9LFxy",
		expScale: "1000000000000000000",
		halfExpScale: "500000000000000000",
		initialExchangeRateMantissa: "1000000000000000000",
		interestRateModel: "KT1MSpyz3t9QwtgrR5aF62JFrCqSSNdwyqXX",
		reserveFactorMantissa: "50000000000000000",
		reserveFactorMaxMantissa: "1000000000000000000",
		totalReserves: "0",
		currentCash: "38700000000",
	},
	XTZ: {
		accrualBlockNumber: "1257893",
		administrator: "KT1M6zHVmMXs4qPwH55U56Kzj2aHgu1we5zN",
		balancesMapId: "179423",
		supply: { totalSupply: "0", supplyRatePerBlock: "0" },
		borrow: {
			totalBorrows: "0",
			borrowIndex: "1000001066621078961",
			borrowRateMaxMantissa: "80000000000",
			borrowRatePerBlock: "0",
		},
		protocolSeizeShareMantissa: "100000000000000",
		comptrollerAddress: "KT1BQu66KEYqBuKB14sgQHrPgqGtuqy9LFxy",
		expScale: "1000000000000000000",
		halfExpScale: "500000000000000000",
		initialExchangeRateMantissa: "1000000000000000000",
		interestRateModel: "KT1BBbAwfDCXFS3zfqtRjMGq9AVpbrXCvJVB",
		reserveFactorMantissa: "50000000000000000",
		reserveFactorMaxMantissa: "1000000000000000000",
		totalReserves: "0",
		currentCash: "0",
	},
};
