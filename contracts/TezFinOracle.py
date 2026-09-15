import smartpy as sp

OracleInterface = sp.io.import_script_from_url(
    "file:contracts/interfaces/OracleInterface.py")

# Michelson-to-EVM gateway (enshrined NAC contract, same address on every Etherlink network).
NAC_GATEWAY = sp.address("KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw")
# selector = keccak256("getPriceNoOlderThan(bytes32,uint256)")[0:4]
GET_PRICE_NO_OLDER_THAN_SELECTOR = sp.bytes("0xa4ae35e0")
# uint256(60) ABI word, used as the default Pyth freshness window until admin overrides it.
DEFAULT_PYTH_MAX_AGE_WORD = sp.bytes(
    "0x" + (60).to_bytes(32, "big").hex())

TPythFeedConfig = sp.TRecord(feedId=sp.TBytes, targetDecimals=sp.TNat)

# Valid hex digits for EVM address validation (setPythCore).
HEX_CHARS = sp.set(l=[c for c in "0123456789abcdefABCDEF"])

# Bound on targetDecimals also bounds the pow10 loop in getPrice, preventing an
# admin-set value from causing an unbounded/gas-heavy normalization loop.
MAX_TARGET_DECIMALS = 30

# SmartPy's `sp.to_int`/INT does not accept `bytes` operands in this toolchain, so ABI words are
# decoded manually via a pinned single-byte lookup table (big-endian, one MUL+ADD per byte).
BYTE_TO_NAT = sp.map(
    l={sp.bytes("0x%02x" % i): i for i in range(256)},
    tkey=sp.TBytes, tvalue=sp.TNat)
TWO_POW_256 = sp.nat(2 ** 256)

class TezFinOracle(OracleInterface.OracleInterface):
    """
        TezFinOracle acts as proxy for the original youves oracle
        It also allows admin to set up custom values for assets that are not be supported by youves enabling the use of those assets in TezFin.
        getPrice resolves overrides/aliases and then reads native feeds directly from Pyth Core
        on Etherlink via the Michelson NAC `staticcall_evm` view.
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
            pythCore=sp.string(""),
            pythMaxAgeWord=DEFAULT_PYTH_MAX_AGE_WORD,
            feedIds=sp.big_map(l={}, tkey=sp.TString, tvalue=TPythFeedConfig),
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

    def _decodeUnsignedWord(self, word):
        """
            Decodes a 32-byte big-endian ABI word into a nat, one byte at a time
        """
        acc = sp.local("acc", sp.nat(0))
        i = sp.local("i", sp.nat(0))
        sp.while i.value < 32:
            currentByte = sp.slice(word, i.value, 1).open_some(
                "MALFORMED_PYTH_RESPONSE")
            acc.value = acc.value * 256 + BYTE_TO_NAT[currentByte]
            i.value += 1
        return acc.value

    def _decodeSignedWord(self, word):
        """
            Decodes a 32-byte big-endian, sign-extended two's complement ABI word into an int
        """
        unsignedValue = self._decodeUnsignedWord(word)
        signByte = sp.slice(word, 0, 1).open_some("MALFORMED_PYTH_RESPONSE")
        result = sp.local("result", sp.int(0))
        sp.if BYTE_TO_NAT[signByte] >= 128:
            result.value = sp.to_int(unsignedValue) - sp.to_int(TWO_POW_256)
        sp.else:
            result.value = sp.to_int(unsignedValue)
        return result.value

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

    @sp.entry_point
    def setPythCore(self, address):
        """
            Sets the pinned Pyth Core EVM address (hex string, e.g. "0x2880...") used by getPrice
        """
        sp.set_type(address, sp.TString)
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        sp.verify(sp.len(address) == 42, "INVALID_PYTH_CORE_ADDRESS_LENGTH")
        prefix = sp.slice(address, 0, 2).open_some("INVALID_PYTH_CORE_ADDRESS_LENGTH")
        sp.verify(prefix == "0x", "INVALID_PYTH_CORE_ADDRESS_PREFIX")
        i = sp.local("i", sp.nat(2))
        sp.while i.value < 42:
            hexChar = sp.slice(address, i.value, 1).open_some(
                "INVALID_PYTH_CORE_ADDRESS_HEX")
            sp.verify(HEX_CHARS.contains(hexChar), "INVALID_PYTH_CORE_ADDRESS_HEX")
            i.value += 1
        self.data.pythCore = address

    @sp.entry_point
    def setPythMaxAge(self, word):
        """
            Sets the ABI uint256 max-age word (32 bytes, big-endian seconds) forwarded to
            Pyth's getPriceNoOlderThan; the encoded value must be in [1, 3600] seconds
        """
        sp.set_type(word, sp.TBytes)
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        sp.verify(sp.len(word) == 32, "INVALID_PYTH_MAX_AGE_WORD")
        maxAgeSeconds = self._decodeUnsignedWord(word)
        sp.verify((maxAgeSeconds >= 1) & (maxAgeSeconds <= 3600),
                  "INVALID_PYTH_MAX_AGE_RANGE")
        self.data.pythMaxAgeWord = word

    @sp.entry_point
    def setFeedIds(self, params):
        """
            Pins Pyth feed ids and their target nat precision (decimals) per base asset symbol
        """
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        sp.set_type(params, sp.TList(sp.TRecord(
            asset=sp.TString, feedId=sp.TBytes, targetDecimals=sp.TNat)))
        sp.for item in params:
            sp.verify(sp.len(item.feedId) == 32, "INVALID_PYTH_FEED_ID")
            sp.verify(item.targetDecimals <= MAX_TARGET_DECIMALS,
                      "INVALID_TARGET_DECIMALS")
            self.data.feedIds[item.asset] = sp.record(
                feedId=item.feedId, targetDecimals=item.targetDecimals)

    @sp.entry_point
    def removeFeedId(self, asset):
        """
            Removes a pinned Pyth feed id
        """
        sp.set_type(asset, sp.TString)
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        del self.data.feedIds[asset]

    def _resolvePythPrice(self, requestedAsset):
        """
            getPrice's upstream lookup: resolve override/alias, then read the pinned Pyth Core
            feed via the Michelson NAC `staticcall_evm` view (getPriceNoOlderThan(bytes32,uint256)).
            Returns (timestamp, normalizedPrice). get_price_with_timestamp reuses this logic via
            a cross-view call to getPrice rather than inlining it a second time (see below).
            Any staticcall_evm failure (stale Pyth cache, revert, bad destination) is fail-closed:
            the call aborts instead of returning a stale/previous price.
        """
        resolvedPrice = sp.local("resolvedPrice", sp.pair(sp.timestamp(0), sp.nat(0)))
        sp.if self.data.overrides.contains(requestedAsset):
            resolvedPrice.value = self.data.overrides[requestedAsset]
        sp.else:
            asset = sp.local("asset", requestedAsset)
            sp.if self.data.alias.contains(requestedAsset):
                asset.value = self.data.alias[requestedAsset]
            sliced_asset = sp.slice(asset.value, 0, sp.as_nat(sp.len(asset.value) - 4)).open_some("failed to convert asset name")
            # L2 policy proxies: tzBTC is valued as BTC and USDtz/USDt as USDT.
            # They intentionally use the native Pyth feeds rather than separate feeds.
            feedAsset = sp.local("feedAsset", sliced_asset)
            sp.if feedAsset.value == "tzBTC":
                feedAsset.value = "BTC"
            sp.if (feedAsset.value == "USDtz") | (feedAsset.value == "USDt"):
                feedAsset.value = "USDT"
            feedConfig = sp.compute(self.data.feedIds.get(
                feedAsset.value, message="UNSUPPORTED_PYTH_ASSET"))
            sp.verify(sp.len(self.data.pythCore) > 0, "PYTH_CORE_NOT_CONFIGURED")

            calldata = sp.concat([GET_PRICE_NO_OLDER_THAN_SELECTOR,
                                  feedConfig.feedId, self.data.pythMaxAgeWord])
            response = sp.view("staticcall_evm", NAC_GATEWAY,
                               sp.pair(self.data.pythCore, calldata),
                               t=sp.TBytes).open_some("PYTH_STATICCALL_FAILED")
            sp.verify(sp.len(response) == 128, "MALFORMED_PYTH_RESPONSE")

            # Pyth's Price struct (int64 price, uint64 conf, int32 expo, uint256 publishTime) is
            # ABI-encoded as four right-aligned/sign-extended 32-byte words.
            priceWord = sp.slice(response, 0, 32).open_some("MALFORMED_PYTH_RESPONSE")
            confWord = sp.slice(response, 32, 32).open_some("MALFORMED_PYTH_RESPONSE")
            expoWord = sp.slice(response, 64, 32).open_some("MALFORMED_PYTH_RESPONSE")
            publishTimeWord = sp.slice(response, 96, 32).open_some("MALFORMED_PYTH_RESPONSE")

            rawPrice = self._decodeSignedWord(priceWord)
            rawConf = self._decodeUnsignedWord(confWord)
            rawExpo = self._decodeSignedWord(expoWord)
            # publishTime is `uint` (uint256) per pyth-sdk-solidity's PythStructs.Price, not signed;
            # the <= sp.now check below still fails closed on any absurdly large decoded value.
            rawPublishTime = self._decodeUnsignedWord(publishTimeWord)

            sp.verify(rawPrice > 0, "NON_POSITIVE_PYTH_PRICE")
            sp.verify((rawExpo >= -30) & (rawExpo <= 0), "INVALID_PYTH_EXPONENT")
            sp.verify(rawPublishTime > 0, "INVALID_PYTH_PUBLISH_TIME")

            publishTimestamp = sp.timestamp(0).add_seconds(sp.to_int(rawPublishTime))
            sp.verify(publishTimestamp <= sp.now, "FUTURE_PYTH_PUBLISH_TIME")

            priceNat = sp.as_nat(rawPrice, message="NON_POSITIVE_PYTH_PRICE")
            # Fail closed if the reported confidence interval exceeds 25% of the price.
            sp.verify(rawConf * 4 <= priceNat, "EXCESSIVE_PYTH_CONFIDENCE")

            # normalizedPrice = price * 10^(expo + targetDecimals), using integer arithmetic only.
            decimalShift = rawExpo + sp.to_int(feedConfig.targetDecimals)
            sp.verify((decimalShift >= -30) & (decimalShift <= 30),
                      "PYTH_NORMALIZATION_OUT_OF_RANGE")
            shiftMagnitude = sp.local("shiftMagnitude", sp.nat(0))
            sp.if decimalShift >= 0:
                shiftMagnitude.value = sp.as_nat(decimalShift)
            sp.else:
                shiftMagnitude.value = sp.as_nat(-decimalShift)
            powerOfTen = sp.local("powerOfTen", sp.nat(1))
            shiftCounter = sp.local("shiftCounter", sp.nat(0))
            sp.while shiftCounter.value < shiftMagnitude.value:
                powerOfTen.value *= 10
                shiftCounter.value += 1
            normalizedPrice = sp.local("normalizedPrice", sp.nat(0))
            sp.if decimalShift >= 0:
                normalizedPrice.value = priceNat * powerOfTen.value
            sp.else:
                normalizedPrice.value = priceNat // powerOfTen.value
            # Integer division on an overly negative exponent can round a genuinely positive
            # Pyth price down to zero; fail closed instead of reporting a free/worthless asset.
            sp.verify(normalizedPrice.value > 0, "ZERO_NORMALIZED_PYTH_PRICE")

            resolvedPrice.value = sp.pair(publishTimestamp, normalizedPrice.value)
        return resolvedPrice.value

    @sp.onchain_view()
    def get_price_with_timestamp(self, requestedAsset):
        """
            Thin (price, timestamp) wrapper around getPrice's Pyth lookup, calling it as a real
            cross-view (not inlined) so the ABI decoding/normalization code exists only once.
        """
        sp.set_type(requestedAsset, sp.TString)
        pricePair = sp.view("getPrice", sp.self_address, requestedAsset,
                            t=sp.TPair(sp.TTimestamp, sp.TNat)).open_some(
                                "invalid oracle view call")
        sp.result(sp.pair(sp.snd(pricePair), sp.fst(pricePair)))

    @sp.onchain_view()
    def getPrice(self, requestedAsset):
        """
            Resolves overrides/aliases, then reads the pinned Pyth Core feed directly via the
            Michelson NAC `staticcall_evm` view (getPriceNoOlderThan(bytes32,uint256)).
            Any staticcall_evm failure (stale Pyth cache, revert, bad destination) is fail-closed:
            the view aborts instead of returning a stale/previous price.
        """
        sp.set_type(requestedAsset, sp.TString)
        sp.result(self._resolvePythPrice(requestedAsset))

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