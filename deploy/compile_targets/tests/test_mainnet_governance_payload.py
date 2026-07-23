#!/usr/bin/env python3
import json
from pathlib import Path
import unittest


ROOT = Path(__file__).resolve().parents[3]
PAYLOAD_PATH = ROOT / "docs" / "MainnetGovernancePayloads.json"
MARKETS = ("XTZ", "USDT", "TZBTC")
MARKET_ACTIONS = ("mint", "borrow", "redeem", "liquidate")


class MainnetGovernancePayloadTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.payload = json.loads(PAYLOAD_PATH.read_text(encoding="utf-8"))
        cls.phases = {phase["name"]: phase for phase in cls.payload["phases"]}

    def test_oracle_max_price_age_is_accepted_by_contract(self):
        max_price_age = self.payload["requiredInputs"][
            "maxPriceTimeDifferenceSeconds"]
        self.assertGreater(max_price_age, 0)
        self.assertLessEqual(max_price_age, 3600)

    def test_closed_market_configuration_is_complete_and_ordered(self):
        operations = self.phases[
            "multisig_configures_closed_markets"]["operations"]
        entrypoints = [operation["entrypoint"] for operation in operations]

        self.assertLess(entrypoints.index("setPriceOracleAndTimeDiff"),
                        entrypoints.index("supportMarket"))
        self.assertLess(entrypoints.index("supportMarket"),
                        entrypoints.index("setPriceBounds"))
        self.assertLess(entrypoints.index("setPriceBounds"),
                        entrypoints.index("setMarketCaps"))
        self.assertLess(entrypoints.index("setMarketCaps"),
                        entrypoints.index("setCollateralFactor"))

        required_inputs = self.payload["requiredInputs"]
        self.assertEqual(set(required_inputs["priceBounds"]), set(MARKETS))
        self.assertEqual(set(required_inputs["marketCaps"]), set(MARKETS))

    def test_unapproved_manifest_remains_blocked_and_fail_closed(self):
        self.assertEqual(self.payload["status"], "INITIAL_DRAFT")

        required_inputs = self.payload["requiredInputs"]
        risk_values = []
        for market in MARKETS:
            risk_values.extend(required_inputs["priceBounds"][market].values())
            risk_values.extend(required_inputs["marketCaps"][market].values())
        self.assertTrue(risk_values)
        self.assertTrue(all(value == "TODO_VALUE" for value in risk_values))

        activation = required_inputs["activateAfterVerification"]
        for market in MARKETS:
            for action in MARKET_ACTIONS:
                self.assertFalse(activation[market][action])
        self.assertFalse(activation["transfers"])

        blocking_conditions = self.phases[
            "multisig_verifies_closed_market_configuration"][
                "blockingConditions"]
        self.assertIn("No TODO_VALUE values remain", blocking_conditions)

    def test_activation_uses_independent_pause_entrypoints(self):
        operations = self.phases[
            "multisig_opens_approved_markets"]["operations"]
        self.assertTrue(all("repeatEntrypoints" not in operation
                            for operation in operations))

        entrypoints = {operation["entrypoint"] for operation in operations}
        self.assertTrue({
            "setMintPaused",
            "setBorrowPaused",
            "setRedeemPaused",
            "setLiquidatePaused",
            "setTransferPaused",
        }.issubset(entrypoints))

    def test_activation_is_preceded_by_storage_verification(self):
        phase_names = [phase["name"] for phase in self.payload["phases"]]
        verification_index = phase_names.index(
            "multisig_verifies_closed_market_configuration")
        activation_index = phase_names.index(
            "multisig_opens_approved_markets")
        self.assertLess(verification_index, activation_index)

        checks = self.phases[
            "multisig_verifies_closed_market_configuration"][
                "requiredStorageChecks"]
        self.assertTrue(any("priceBounds" in check for check in checks))
        self.assertTrue(any("supplyCap" in check and "borrowCap" in check
                            for check in checks))
        self.assertTrue(any("liquidation" in check for check in checks))


if __name__ == "__main__":
    unittest.main()
