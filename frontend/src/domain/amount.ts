declare const atomicAmountBrand: unique symbol;
declare const assetIdBrand: unique symbol;

export type AtomicAmount = string & {
  readonly [atomicAmountBrand]: "AtomicAmount";
};

export type AssetId = string & {
  readonly [assetIdBrand]: "AssetId";
};

export interface AssetAmount {
  readonly assetId: AssetId;
  readonly atomic: AtomicAmount;
  readonly decimals: number;
}

const atomicAmountPattern = /^(0|[1-9]\d*)$/;
const assetIdPattern = /^[a-z0-9][a-z0-9._-]*$/;

export function createAtomicAmount(value: string): AtomicAmount {
  if (!atomicAmountPattern.test(value)) {
    throw new TypeError("Atomic amounts must be canonical non-negative integers");
  }

  return value as AtomicAmount;
}

export function createAssetId(value: string): AssetId {
  if (!assetIdPattern.test(value)) {
    throw new TypeError("Asset identifiers must use canonical lowercase characters");
  }

  return value as AssetId;
}

export function createAssetAmount(
  assetId: AssetId,
  atomic: AtomicAmount,
  decimals: number,
): AssetAmount {
  if (!Number.isSafeInteger(decimals) || decimals < 0 || decimals > 255) {
    throw new RangeError("Asset decimals must be an integer from 0 through 255");
  }

  return { assetId, atomic, decimals };
}
