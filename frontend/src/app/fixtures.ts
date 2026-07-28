import type {
  MarketFixture,
  PositionTotals,
  ScenarioFixture,
  ScenarioId,
} from "./types";

const asset = (name: string) => `/assets/${name}`;

const baseMarkets: MarketFixture[] = [
  {
    id: "XTZ",
    name: "XTZ",
    subtitle: "Tez",
    price: 0.94,
    supplyApy: 1.42,
    borrowApy: 4.87,
    collateralFactor: 0.65,
    fTokenRate: 47.13,
    liquidityUsd: 2_140_000,
    walletBalance: 1240.5,
    supplied: 0,
    borrowed: 0,
    collateral: false,
    icon: asset("XTZ.svg"),
    fTokenIcon: asset("fXTZ.svg"),
    standard: "XTZ",
  },
  {
    id: "tzBTC",
    name: "tzBTC",
    subtitle: "Wrapped Bitcoin",
    price: 104_200,
    supplyApy: 0.09,
    borrowApy: 1.81,
    collateralFactor: 0.75,
    fTokenRate: 49.02,
    liquidityUsd: 1_860_000,
    walletBalance: 0.0061,
    supplied: 0,
    borrowed: 0,
    collateral: false,
    icon: asset("tzBTC.svg"),
    fTokenIcon: asset("ftzBTC.svg"),
    standard: "FA1.2 packed",
  },
  {
    id: "USDt",
    name: "USDt",
    subtitle: "Tether USD",
    price: 1,
    supplyApy: 3.86,
    borrowApy: 6.92,
    collateralFactor: 0.78,
    fTokenRate: 46.2,
    liquidityUsd: 1_240_000,
    walletBalance: 512.8,
    supplied: 0,
    borrowed: 0,
    collateral: false,
    icon: asset("usdt.svg"),
    fTokenIcon: asset("fusdt.svg"),
    standard: "FA2",
  },
  {
    id: "USDtz",
    name: "USDtz",
    subtitle: "USD Tez",
    price: 1,
    supplyApy: 2.14,
    borrowApy: 5.06,
    collateralFactor: 0.7,
    fTokenRate: 48.11,
    liquidityUsd: 612_000,
    walletBalance: 84.2,
    supplied: 0,
    borrowed: 0,
    collateral: false,
    icon: asset("USDtz.svg"),
    fTokenIcon: asset("fusdtz.svg"),
    standard: "FA1.2",
  },
  {
    id: "stXTZ",
    name: "stXTZ",
    subtitle: "Staked Tez",
    price: 1.09,
    supplyApy: 5.62,
    borrowApy: 7.4,
    collateralFactor: 0.55,
    fTokenRate: 45.87,
    liquidityUsd: 310_000,
    walletBalance: 0,
    supplied: 0,
    borrowed: 0,
    collateral: false,
    icon: asset("stacy_logo.png"),
    fTokenIcon: asset("fstXTZ.svg"),
    standard: "FA2",
  },
];

function cloneMarkets(): MarketFixture[] {
  return baseMarkets.map((market) => ({ ...market }));
}

function positionedMarkets(usdtBorrowedUsd = 0, usdtzBorrowedUsd = 0): MarketFixture[] {
  return cloneMarkets().map((market) => {
    if (market.id === "XTZ") {
      return { ...market, supplied: 8400, collateral: true };
    }
    if (market.id === "tzBTC") {
      return { ...market, supplied: 0.042, collateral: true };
    }
    if (market.id === "USDt") {
      return { ...market, borrowed: usdtBorrowedUsd };
    }
    if (market.id === "USDtz") {
      return { ...market, borrowed: usdtzBorrowedUsd };
    }
    return market;
  });
}

export const scenarios: Record<ScenarioId, ScenarioFixture> = {
  disconnected: {
    id: "disconnected",
    label: "Disconnected",
    connected: false,
    block: "9,412,338",
    markets: cloneMarkets(),
  },
  fresh: {
    id: "fresh",
    label: "Fresh wallet",
    connected: true,
    address: "tz1ZkH8f8M4V...7sQ2rV",
    block: "9,412,338",
    markets: cloneMarkets(),
  },
  supplying: {
    id: "supplying",
    label: "Supplying only",
    connected: true,
    address: "tz1ZkH8f8M4V...7sQ2rV",
    block: "9,412,338",
    markets: positionedMarkets(),
  },
  active: {
    id: "active",
    label: "Active position",
    connected: true,
    address: "tz1ZkH8f8M4V...7sQ2rV",
    block: "9,412,338",
    markets: positionedMarkets(6300),
  },
  "near-liquidation": {
    id: "near-liquidation",
    label: "Near liquidation",
    connected: true,
    address: "tz1ZkH8f8M4V...7sQ2rV",
    block: "9,412,338",
    markets: positionedMarkets(6000, 2000),
  },
};

export function calculateTotals(markets: MarketFixture[]): PositionTotals {
  const raw = markets.reduce(
    (totals, market) => {
      const suppliedUsd = market.supplied * market.price;
      const borrowedUsd = market.borrowed * market.price;

      totals.suppliedUsd += suppliedUsd;
      totals.borrowedUsd += borrowedUsd;
      totals.annualSupplyUsd += suppliedUsd * (market.supplyApy / 100);
      totals.annualBorrowUsd += borrowedUsd * (market.borrowApy / 100);

      if (market.collateral) {
        totals.collateralUsd += suppliedUsd;
        totals.borrowLimitUsd += suppliedUsd * market.collateralFactor;
      }

      return totals;
    },
    {
      suppliedUsd: 0,
      borrowedUsd: 0,
      collateralUsd: 0,
      borrowLimitUsd: 0,
      annualSupplyUsd: 0,
      annualBorrowUsd: 0,
    },
  );

  const equity = raw.suppliedUsd - raw.borrowedUsd;
  const estimatedNetRate =
    equity > 0
      ? ((raw.annualSupplyUsd - raw.annualBorrowUsd) / equity) * 100
      : 0;

  return {
    ...raw,
    headroomUsd: Math.max(raw.borrowLimitUsd - raw.borrowedUsd, 0),
    limitUsedPercent:
      raw.borrowLimitUsd > 0
        ? (raw.borrowedUsd / raw.borrowLimitUsd) * 100
        : 0,
    estimatedNetRate,
  };
}
