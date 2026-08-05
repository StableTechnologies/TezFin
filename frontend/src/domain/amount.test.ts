import { describe, expect, it } from "vitest";
import {
  createAssetAmount,
  createAssetId,
  createAtomicAmount,
} from "./amount";

describe("financial value primitives", () => {
  it("preserves atomic amounts larger than JavaScript's safe integer range", () => {
    expect(createAtomicAmount("9007199254740993123456789")).toBe(
      "9007199254740993123456789",
    );
  });

  it.each(["-1", "1.5", "01", "1e6", "", " 1"])(
    "rejects non-canonical atomic amount %s",
    (value) => {
      expect(() => createAtomicAmount(value)).toThrow(TypeError);
    },
  );

  it("constructs an asset amount without converting its atomic value", () => {
    const amount = createAssetAmount(
      createAssetId("xtz"),
      createAtomicAmount("1234567"),
      6,
    );

    expect(amount).toEqual({
      assetId: "xtz",
      atomic: "1234567",
      decimals: 6,
    });
  });

  it.each([-1, 1.5, 256, Number.NaN])(
    "rejects invalid decimal metadata %s",
    (decimals) => {
      expect(() =>
        createAssetAmount(
          createAssetId("xtz"),
          createAtomicAmount("1"),
          decimals,
        ),
      ).toThrow(RangeError);
    },
  );
});
