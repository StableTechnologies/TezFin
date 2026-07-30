import smartpy as sp

OracleInterface = sp.io.import_script_from_url("file:contracts/interfaces/OracleInterface.py")

class OracleMock(OracleInterface.OracleInterface):
    def __init__(self):
        self.init(
            price=sp.nat(0),
            timestamp=sp.none,
            priceBounds=sp.big_map(
                l={}, tkey=sp.TPair(sp.TAddress, sp.TAddress),
                tvalue=OracleInterface.TPriceBounds),
            maxPriceAge=sp.big_map(l={}, tkey=sp.TAddress, tvalue=sp.TInt))
        
    @sp.entry_point
    def setPrice(self, price):
        sp.set_type(price, sp.TNat)
        self.data.price = price

    @sp.entry_point
    def setTimestamp(self, timestamp):
        sp.set_type(timestamp, sp.TTimestamp)
        self.data.timestamp = sp.some(timestamp)

    @sp.entry_point
    def clearTimestamp(self):
        self.data.timestamp = sp.none

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

    def getTimestamp(self):
        timestamp = sp.local("timestamp", sp.now)
        sp.if self.data.timestamp.is_some():
            timestamp.value = self.data.timestamp.open_some()
        return timestamp.value
        
    @sp.entry_point
    def get(self, requestPair):
        sp.set_type(requestPair, OracleInterface.TGetPriceParam)

        # Destructure the arguments.
        requestedAsset = sp.compute(sp.fst(requestPair))
        callback = sp.compute(sp.snd(requestPair))
        
        callbackParam = (requestedAsset, (self.getTimestamp(), self.data.price))
        sp.transfer(callbackParam, sp.mutez(0), callback)

    @sp.onchain_view()
    def getPrice(self, assetCode):
        sp.set_type(assetCode, sp.TString)
        sp.result((self.getTimestamp(), self.data.price))

    @sp.onchain_view()
    def getValidatedPrice(self, params):
        sp.set_type(params, OracleInterface.TValidatedPriceRequest)
        configKey = sp.pair(params.comptroller, params.cToken)
        sp.verify(self.data.priceBounds.contains(configKey),
                  "PRICE_BOUNDS_NOT_CONFIGURED")
        sp.verify(self.data.maxPriceAge.contains(params.comptroller),
                  "MAX_PRICE_AGE_NOT_CONFIGURED")
        timestamp = self.getTimestamp()
        bounds = self.data.priceBounds[configKey]
        sp.verify(timestamp > sp.timestamp(0), "INVALID_ASSET_PRICE_TIMESTAMP")
        sp.verify(timestamp <= sp.now, "FUTURE_ASSET_PRICE")
        sp.verify(sp.now - timestamp <= self.data.maxPriceAge[params.comptroller],
                  "STALE_ASSET_PRICE")
        sp.verify((params.previousTimestamp == sp.timestamp(0)) |
                  (timestamp >= params.previousTimestamp),
                  "ASSET_PRICE_TIMESTAMP_ROLLBACK")
        sp.verify((self.data.price >= bounds.minPrice) &
                  (self.data.price <= bounds.maxPrice),
                  "ASSET_PRICE_OUT_OF_BOUNDS")
        sp.if params.previousTimestamp != sp.timestamp(0):
            priceChange = sp.local("priceChange", sp.nat(0))
            sp.if self.data.price >= params.previousPrice:
                priceChange.value = sp.as_nat(self.data.price - params.previousPrice)
            sp.else:
                priceChange.value = sp.as_nat(params.previousPrice - self.data.price)
            sp.verify(priceChange.value * 10000 <=
                      params.previousPrice * bounds.maxChangeBps,
                      "ASSET_PRICE_CHANGE_TOO_LARGE")
        sp.result((timestamp, self.data.price))
