import smartpy as sp
import time

OracleInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/OracleInterface.py")

class TezFinOracle(OracleInterface.OracleInterface):
    """
        TezFinOracle acts as proxy for the original youves oracle
        It also allows admin to set up custom values for assets that are not be supported by youves enabling the use of those assets in TezFin.
    """

    def __init__(self, admin, oracle):
        self.init(
            overrides=sp.big_map(l={"USD-USD": (sp.timestamp(int(time.time())), sp.as_nat(
                1000000)),"USDT-USD": (sp.timestamp(int(time.time())), sp.as_nat(
                1000000))}, tkey=sp.TString, tvalue=sp.TPair(sp.TTimestamp, sp.TNat)),
            alias=sp.big_map(l={"OXTZ-USD": "XTZ-USD", "WTZ-USD": "XTZ-USD", "TZBTC-USD":"BTC-USD"},
                             tkey=sp.TString, tvalue=sp.TString),
            oracle=oracle,
            admin=admin,
            pendingAdmin=sp.none,
        )

    def is_admin(self, address):
        return address == self.data.admin

    @sp.entry_point
    def set_oracle(self, address):
        """
            Sets the youves Oracle Address used to resolve asset prices
        """
        sp.set_type(address, sp.TAddress)
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        self.data.oracle = address

    @sp.entry_point
    def set_pending_admin(self, pendingAdminAddress):
        sp.set_type(pendingAdminAddress, sp.TAddress)
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        self.data.pendingAdmin = sp.some(pendingAdminAddress)

    @sp.entry_point
    def accept_admin(self):
        sp.verify(sp.sender == self.data.pendingAdmin.open_some("NOT_SET_PENDING_ADMIN"), "NOT_PENDING_ADMIN")
        self.data.admin = sp.sender
        self.data.pendingAdmin = sp.none

    @sp.entry_point
    def setPrice(self, params):
        """
            Sets the price for custom assets not supported by youves eg. USD
        """
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        sp.set_type(params, sp.TList(
            sp.TRecord(asset=sp.TString, price=sp.TNat)))
        sp.for item in params:
            self.data.overrides[item.asset] = (sp.now, item.price)

    @sp.entry_point
    def removeAsset(self, asset):
        """
            Removes custom asset
        """
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        del self.data.overrides[asset]

    @sp.entry_point
    def addAlias(self, params):
        """
            Adds alias for assets supported by original oracle
        """
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        sp.set_type(params, sp.TList(
            sp.TRecord(alias=sp.TString, asset=sp.TString)))
        sp.for item in params:
            self.data.alias[item.alias] = item.asset

    @sp.entry_point
    def removeAlias(self, asset):
        """
            Removes alias
        """
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        del self.data.alias[asset]

    @sp.onchain_view()
    def get_price_with_timestamp(self, requestedAsset):
        """
            Proxies to youves getPrice view if not custom asset
        """
        sp.set_type(requestedAsset, sp.TString)
        sp.if self.data.overrides.contains(requestedAsset):
            sp.result((sp.snd(self.data.overrides[requestedAsset]), sp.now))
        sp.else:
            asset = sp.local("asset", requestedAsset)
            sp.if self.data.alias.contains(requestedAsset):
                asset.value = self.data.alias[requestedAsset]
            sliced_asset = sp.slice(asset.value, 0, sp.as_nat(sp.len(asset.value) - 4)).open_some("failed to convert asset name")
            oracle_data = sp.view("get_price_with_timestamp", self.data.oracle, sliced_asset+"USDT", t=sp.TPair(
                sp.TNat, sp.TTimestamp)).open_some("invalid oracle view call")
            sp.result(oracle_data)

    @sp.onchain_view()
    def getPrice(self, requestedAsset):
        """
            Proxies to youves getPrice view if not custom asset
        """
        sp.set_type(requestedAsset, sp.TString)
        sp.if self.data.overrides.contains(requestedAsset):
            sp.result((sp.now, sp.snd(self.data.overrides[requestedAsset])))
        sp.else:
            asset = sp.local("asset", requestedAsset)
            sp.if self.data.alias.contains(requestedAsset):
                asset.value = self.data.alias[requestedAsset]
            sliced_asset = sp.slice(asset.value, 0, sp.as_nat(sp.len(asset.value) - 4)).open_some("failed to convert asset name")
            oracle_data = sp.view("get_price_with_timestamp", self.data.oracle, sliced_asset+"USDT", t=sp.TPair(
                sp.TNat, sp.TTimestamp)).open_some("invalid oracle view call")
            sp.result((sp.snd(oracle_data), sp.fst(oracle_data)))