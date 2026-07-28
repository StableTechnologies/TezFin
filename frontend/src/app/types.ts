/**
 * Presentation-only values used by the offline dashboard fixtures.
 * Production protocol adapters must use the exact atomic-amount primitives in
 * `src/domain/amount.ts` and must not pass financial values through `number`.
 */
export type ScenarioId =
  | "disconnected"
  | "fresh"
  | "supplying"
  | "active"
  | "near-liquidation";

export type AssetId = "XTZ" | "tzBTC" | "USDt" | "USDtz" | "stXTZ";
export type TokenStandard = "XTZ" | "FA1.2" | "FA1.2 packed" | "FA2";
export type TransactionAction =
  | "Supply"
  | "Withdraw"
  | "Borrow"
  | "Repay"
  | "Enable collateral"
  | "Disable collateral";

export interface MarketFixture {
  id: AssetId;
  name: string;
  subtitle: string;
  price: number;
  supplyApy: number;
  borrowApy: number;
  collateralFactor: number;
  fTokenRate: number;
  liquidityUsd: number;
  walletBalance: number;
  supplied: number;
  borrowed: number;
  collateral: boolean;
  icon: string;
  fTokenIcon: string;
  standard: TokenStandard;
}

export interface ScenarioFixture {
  id: ScenarioId;
  label: string;
  connected: boolean;
  address?: string;
  block: string;
  markets: MarketFixture[];
}

export interface PositionTotals {
  suppliedUsd: number;
  borrowedUsd: number;
  collateralUsd: number;
  borrowLimitUsd: number;
  headroomUsd: number;
  limitUsedPercent: number;
  annualSupplyUsd: number;
  annualBorrowUsd: number;
  estimatedNetRate: number;
}

export interface TransactionDraft {
  marketId: AssetId;
  action: TransactionAction;
}

export interface OperationStep {
  label: string;
  detail: string;
}
