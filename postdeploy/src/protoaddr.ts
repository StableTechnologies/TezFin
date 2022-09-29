import { ProtocolAddresses, AssetType } from "tezoslendingplatformjs";
export const protoAddr: any = {
	fTokens: {
		BTC: "KT18p8dYUqYtRNzckc8cCqHC9YyUa92GkjNA",
		XTZ: "KT1WnBaYmJUtdtKpB16nrJRHYqAxc9NrSMcz",
		ETH: "KT1FdTH6Wssjm5EPVmX62oFkVquKfJVyUMTa",
		USD: "KT1NGzKhJ5SGVsFqbfAWZbi5CkENsunv4Tmh",
	},
	fTokensReverse: {
		KT1WnBaYmJUtdtKpB16nrJRHYqAxc9NrSMcz: "XTZ",
		KT1FdTH6Wssjm5EPVmX62oFkVquKfJVyUMTa: "ETH",
		KT1NGzKhJ5SGVsFqbfAWZbi5CkENsunv4Tmh: "USD",
		KT18p8dYUqYtRNzckc8cCqHC9YyUa92GkjNA: "BTC",
	},
	underlying: {
		ETH: {
			assetType: "ETH",
			tokenStandard: 1,
			decimals: 18,
			address: "KT1Mcr4Zi8Xc8TLUUA1pNpmP5SEmVP13VaCw",
			balancesMapId: 34651,
			balancesPath: "$.args[1].int",
		},
		USD: {
			assetType: "USD",
			address: "KT18hWQrHxiBFG6ZDeeKLoiqMKKv5ZwcHsK1",
			balancesMapId: 34654,
			tokenStandard: 1,
			decimals: 6,
			balancesPath: "$.args[1].int",
		},
		BTC: {
			assetType: "BTC",
			tokenStandard: 2,
			decimals: 8,
			address: "KT1NcKjNpKpaxJfHFKLMDw3UULf1BKk14DEw",
			tokenId: 0,
			balancesMapId: 34646,
			balancesPath: "$.int",
		},
		XTZ: { assetType: "XTZ", tokenStandard: 0, decimals: 6 },
	},
	comptroller: "KT1M12zcam3fQH2VsSphxxoEVXBEhNM6dYCC",
	interestRateModel: {
		XTZ: "KT1NFH3X6gqRABpdFpGEExdPR9t6S3W8gh4v",
		ETH: "KT1DVNJJiLjexYkE5Lh1SuCq1mo8xXxwAXfw",
		USD: "KT1DVNJJiLjexYkE5Lh1SuCq1mo8xXxwAXfw",
		BTC: "KT1GLAD4E9ndAAfAKNaYtyGWUUeycXNdPidp",
	},
	governance: "KT1MyYjK7KHuwWb9G5hUnnLc5jY2kUTmWS16",
	oracleMap: {
		ETH: { id: 178712, path: "$.args[1].int" },
		USD: { id: 178712, path: "$.args[1].int" },
		BTC: { id: 178712, path: "$.args[1].int" },
		XTZ: { id: 178712, path: "$.args[1].int" },
	},
};


