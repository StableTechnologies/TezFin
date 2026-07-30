import smartpy as sp

OracleInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/OracleInterface.py")

class TezFinOracle(OracleInterface.OracleInterface):
    """
        TezFinOracle acts as proxy for the original youves oracle
        It also allows admin to set up custom values for assets that are not be supported by youves enabling the use of those assets in TezFin.
    """

    def __init__(self, admin, oracle):
        self.init(
            overrides=sp.big_map(l={}, tkey=sp.TString,
                                 tvalue=sp.TPair(sp.TTimestamp, sp.TNat)),
            priceBounds=sp.big_map(
                l={}, tkey=sp.TPair(sp.TAddress, sp.TAddress),
                tvalue=OracleInterface.TPriceBounds),
            maxPriceAge=sp.big_map(l={}, tkey=sp.TAddress, tvalue=sp.TInt),
            alias=sp.big_map(l={"OXTZ-USD": "XTZ-USD", "WTZ-USD": "XTZ-USD", "STXTZ-USD": "XTZ-USD"},
                             tkey=sp.TString, tvalue=sp.TString),
            oracle=oracle,
            admin=admin,
            pendingAdmin=sp.none,
        )

    @sp.private_lambda(with_storage="read-only")
    def is_admin(self, address):
        sp.result(address == self.data.admin)

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

    @sp.entry_point
    def configurePriceBounds(self, params):
        sp.set_type(params, OracleInterface.TPriceBounds)
        sp.verify((params.minPrice > 0) &
                  (params.minPrice <= params.maxPrice) &
                  (params.maxChangeBps <= 10000),
                  "INVALID_PRICE_BOUNDS")
        self.data.priceBounds[sp.pair(sp.sender, params.cToken)] = params

    @sp.entry_point
    def configureMaxPriceAge(self, maxPriceAge):
        sp.set_type(maxPriceAge, sp.TInt)
        sp.verify((maxPriceAge > 0) & (maxPriceAge <= 3600),
                  "INVALID_MAX_PRICE_TIME_DIFFERENCE")
        self.data.maxPriceAge[sp.sender] = maxPriceAge

    @sp.onchain_view()
    def get_price_with_timestamp(self, requestedAsset):
        """
            Proxies to youves getPrice view if not custom asset
        """
        sp.set_type(requestedAsset, sp.TString)
        sp.if self.data.overrides.contains(requestedAsset):
            sp.result((sp.snd(self.data.overrides[requestedAsset]),
                       sp.fst(self.data.overrides[requestedAsset])))
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
            sp.result(self.data.overrides[requestedAsset])
        sp.else:
            asset = sp.local("asset", requestedAsset)
            sp.if self.data.alias.contains(requestedAsset):
                asset.value = self.data.alias[requestedAsset]
            sliced_asset = sp.slice(asset.value, 0, sp.as_nat(sp.len(asset.value) - 4)).open_some("failed to convert asset name")
            oracle_data = sp.view("get_price_with_timestamp", self.data.oracle, sliced_asset+"USDT", t=sp.TPair(
                sp.TNat, sp.TTimestamp)).open_some("invalid oracle view call")
            sp.result((sp.snd(oracle_data), sp.fst(oracle_data)))

    @sp.onchain_view()
    def getValidatedPrice(self, params):
        sp.set_type(params, OracleInterface.TValidatedPriceRequest)
        configKey = sp.pair(params.comptroller, params.cToken)
        sp.verify(self.data.priceBounds.contains(configKey),
                  "PRICE_BOUNDS_NOT_CONFIGURED")
        sp.verify(self.data.maxPriceAge.contains(params.comptroller),
                  "MAX_PRICE_AGE_NOT_CONFIGURED")
        pricePair = sp.view("getPrice", sp.self_address, params.requestedAsset,
                            t=sp.TPair(sp.TTimestamp, sp.TNat)).open_some(
                                "invalid oracle price view")
        priceTimestamp = sp.fst(pricePair)
        rawPrice = sp.snd(pricePair)
        bounds = self.data.priceBounds[configKey]
        sp.verify(priceTimestamp > sp.timestamp(0),
                  "INVALID_ASSET_PRICE_TIMESTAMP")
        sp.verify(priceTimestamp <= sp.now, "FUTURE_ASSET_PRICE")
        sp.verify(sp.now - priceTimestamp <=
                  self.data.maxPriceAge[params.comptroller],
                  "STALE_ASSET_PRICE")
        sp.verify((params.previousTimestamp == sp.timestamp(0)) |
                  (priceTimestamp >= params.previousTimestamp),
                  "ASSET_PRICE_TIMESTAMP_ROLLBACK")
        sp.verify((rawPrice >= bounds.minPrice) &
                  (rawPrice <= bounds.maxPrice),
                  "ASSET_PRICE_OUT_OF_BOUNDS")
        sp.if params.previousTimestamp != sp.timestamp(0):
            priceChange = sp.local("priceChange", sp.nat(0))
            sp.if rawPrice >= params.previousPrice:
                priceChange.value = sp.as_nat(rawPrice - params.previousPrice)
            sp.else:
                priceChange.value = sp.as_nat(params.previousPrice - rawPrice)
            sp.verify(priceChange.value * 10000 <=
                      params.previousPrice * bounds.maxChangeBps,
                      "ASSET_PRICE_CHANGE_TOO_LARGE")
        sp.result(pricePair)