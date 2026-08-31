"""Consumer-state harness for the pinned TezOracle contract.

The exact SmartPy 0.24.2 source is compiled and ABI-checked separately. This
legacy-SmartPy harness mirrors quote maturity, quarantine, and delayed global
and per-asset unpause. Signatures and config-version governance intentionally
remain in the exact TezOracle test suite.
"""

import smartpy as sp

TQuote = sp.TRecord(
    price=sp.TNat,
    observation_time=sp.TTimestamp,
    accepted_level=sp.TNat,
    activation_level=sp.TNat,
).layout(("price", ("observation_time", ("accepted_level", "activation_level"))))

TSubmit = sp.TRecord(
    asset_id=sp.TString,
    price=sp.TNat,
    observation_time=sp.TTimestamp,
).layout(("asset_id", ("price", "observation_time")))


class TezOracleHarness(sp.Contract):
    def __init__(self, activation_delay_levels=1):
        self.init(
            activationDelayLevels=sp.nat(activation_delay_levels),
            paused=sp.bool(False),
            lastGlobalPauseLevel=sp.nat(0),
            pendingUnpauseLevel=sp.none,
            assetPaused=sp.set(t=sp.TString),
            pendingAssetUnpause=sp.big_map(
                tkey=sp.TString, tvalue=sp.TNat),
            knownAssets=sp.set([
                "BTC_USD",
                "USDT_USD",
                "XTZ_USD",
                "USDTZ_USD",
                "TZBTC_USD",
            ]),
            active=sp.big_map(tkey=sp.TString, tvalue=TQuote),
            pending=sp.big_map(tkey=sp.TString, tvalue=TQuote),
        )

    @sp.entry_point
    def submit(self, params):
        sp.set_type(params, TSubmit)
        sp.verify(~self.data.paused, "PAUSED")
        sp.verify(self.data.knownAssets.contains(params.asset_id), "ASSET_ID")
        sp.verify(~self.data.assetPaused.contains(params.asset_id), "ASSET_PAUSED")
        self.data.pending[params.asset_id] = sp.record(
            price=params.price,
            observation_time=params.observation_time,
            accepted_level=sp.level,
            activation_level=sp.level + self.data.activationDelayLevels,
        )

    @sp.entry_point
    def promote(self, asset_id):
        sp.set_type(asset_id, sp.TString)
        quote = self.data.pending[asset_id]
        sp.verify(quote.accepted_level > self.data.lastGlobalPauseLevel, "NO_PRICE")
        sp.verify(sp.level >= quote.activation_level, "NO_PRICE")
        self.data.active[asset_id] = quote
        del self.data.pending[asset_id]

    @sp.entry_point
    def pause(self):
        self.data.paused = True
        self.data.lastGlobalPauseLevel = sp.level
        self.data.pendingUnpauseLevel = sp.none

    @sp.entry_point
    def propose_unpause(self):
        sp.verify(self.data.paused, "NOT_PAUSED")
        self.data.pendingUnpauseLevel = sp.some(
            sp.level + self.data.activationDelayLevels)

    @sp.entry_point
    def activate_unpause(self):
        activationLevel = self.data.pendingUnpauseLevel.open_some("NO_PENDING")
        sp.verify(sp.level >= activationLevel, "DELAY")
        self.data.paused = False
        self.data.pendingUnpauseLevel = sp.none

    @sp.entry_point
    def pause_asset(self, asset_id):
        sp.set_type(asset_id, sp.TString)
        self.data.assetPaused.add(asset_id)
        sp.if self.data.pendingAssetUnpause.contains(asset_id):
            del self.data.pendingAssetUnpause[asset_id]
        sp.if self.data.pending.contains(asset_id):
            del self.data.pending[asset_id]

    @sp.entry_point
    def propose_asset_unpause(self, asset_id):
        sp.set_type(asset_id, sp.TString)
        sp.verify(self.data.assetPaused.contains(asset_id), "NOT_PAUSED")
        self.data.pendingAssetUnpause[asset_id] = (
            sp.level + self.data.activationDelayLevels)

    @sp.entry_point
    def activate_asset_unpause(self, asset_id):
        sp.set_type(asset_id, sp.TString)
        sp.verify(self.data.pendingAssetUnpause.contains(asset_id), "NO_PENDING")
        sp.verify(
            sp.level >= self.data.pendingAssetUnpause[asset_id], "DELAY")
        self.data.assetPaused.remove(asset_id)
        del self.data.pendingAssetUnpause[asset_id]

    @sp.entry_point
    def clear_price(self, asset_id):
        sp.set_type(asset_id, sp.TString)
        sp.if self.data.active.contains(asset_id):
            del self.data.active[asset_id]
        sp.if self.data.pending.contains(asset_id):
            del self.data.pending[asset_id]

    @sp.onchain_view()
    def get_price_with_timestamp(self, asset_id):
        sp.set_type(asset_id, sp.TString)
        sp.verify(~self.data.paused, "PAUSED")
        sp.verify(self.data.knownAssets.contains(asset_id), "ASSET_ID")
        sp.verify(~self.data.assetPaused.contains(asset_id), "ASSET_PAUSED")
        found = sp.local("found", False)
        price = sp.local("price", sp.nat(0))
        observationTime = sp.local("observationTime", sp.timestamp(0))
        sp.if self.data.pending.contains(asset_id):
            pending = self.data.pending[asset_id]
            pendingCurrent = sp.local(
                "pendingCurrent",
                (pending.accepted_level > self.data.lastGlobalPauseLevel)
                & (sp.level >= pending.activation_level))
            sp.if pendingCurrent.value:
                found.value = True
                price.value = pending.price
                observationTime.value = pending.observation_time
        sp.if (~found.value) & self.data.active.contains(asset_id):
            active = self.data.active[asset_id]
            found.value = True
            price.value = active.price
            observationTime.value = active.observation_time
        sp.verify(found.value, "NO_PRICE")
        sp.result(sp.pair(price.value, observationTime.value))
