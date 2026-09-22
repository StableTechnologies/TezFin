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

# maxConfidenceBps is mandatory (no default/implicit limit): a feed can only be pinned by
# setFeedIds together with an explicit basis-points confidence limit, so there is no way to
# configure or activate a feed that resolves prices without one.
TPythFeedConfig = sp.TRecord(feedId=sp.TBytes, targetDecimals=sp.TNat, maxConfidenceBps=sp.TNat)

# Valid hex digits for EVM address validation (setPythCore).
HEX_CHARS = sp.set(l=[c for c in "0123456789abcdefABCDEF"])

# Bound on targetDecimals also bounds the pow10 loop in getPrice, preventing an
# admin-set value from causing an unbounded/gas-heavy normalization loop.
MAX_TARGET_DECIMALS = 30

# Basis-points denominator; also the maximum admin-settable maxConfidenceBps (100%).
BPS_DENOMINATOR = 10000

# SmartPy's `sp.to_int`/INT does not accept `bytes` operands in this toolchain, so ABI words are
# decoded manually via a pinned single-byte lookup table (big-endian, one MUL+ADD per byte).
BYTE_TO_NAT = sp.map(
    l={sp.bytes("0x%02x" % i): i for i in range(256)},
    tkey=sp.TBytes, tvalue=sp.TNat)
# Canonical two's-complement sign-extension bounds for validating ABI padding without a
# per-byte loop. For an UNSIGNED N-bit field (e.g. Pyth's uint64 confidence) every one of
# its N bits is magnitude, so canonicity is just the full 256-bit value fitting under 2**N.
# For a SIGNED N-bit field (e.g. int64 price, int32 exponent) the sign bit lives at bit
# N-1, not bit N: a canonical sign-extension is the set of unsigned 256-bit values below
# 2**(N-1) (non-negative, sign bit clear) or at/above 2**256-2**(N-1) (negative, sign bit
# set and fully extended). Using 2**N there instead would wrongly accept a zero-extended
# word whose bit N-1 (the actual int sign bit) is set as an oversized positive value.
TWO_POW_64 = sp.nat(2 ** 64)
NEG_THRESHOLD_64 = sp.nat(2 ** 256 - 2 ** 64)
TWO_POW_63 = sp.nat(2 ** 63)
NEG_THRESHOLD_63 = sp.nat(2 ** 256 - 2 ** 63)
TWO_POW_31 = sp.nat(2 ** 31)
NEG_THRESHOLD_31 = sp.nat(2 ** 256 - 2 ** 31)

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
        """Decodes a 32-byte big-endian ABI word into a nat."""
        sp.verify(sp.len(word) == 32, "MALFORMED_PYTH_RESPONSE")
        value = sp.local("value", sp.nat(0))
        i = sp.local("i", sp.nat(0))
        sp.while i.value < 32:
            currentByte = sp.slice(word, i.value, 1).open_some("MALFORMED_PYTH_RESPONSE")
            value.value = value.value * 256 + BYTE_TO_NAT[currentByte]
            i.value += 1
        return value.value

    def _decodeUint64Word(self, word):
        """
            Decodes the right-aligned uint64 payload used by Pyth confidence. As an unsigned
            ABI type its 24 high bytes must always be zero (no sign-extension is valid here);
            canonicity is equivalent to the full 256-bit value fitting under 2**64.
        """
        value = self._decodeUnsignedWord(word)
        sp.verify(value < TWO_POW_64, "MALFORMED_PYTH_RESPONSE")
        return value

    def _decodePriceWord(self, word):
        """
            Decodes a canonical Pyth int64 price. Reinterpreting the whole 256-bit word as
            two's complement, a canonical 64-bit-wide signed sign-extension is exactly the
            set of values that fit under 2**63 (non-negative, sign bit clear) or sit at/above
            2**256-2**63 (negative, sign bit set and fully extended); any other value --
            including a zero-extended word whose bit 63 is set, i.e. in [2**63, 2**64) -- has
            inconsistent padding/sign bytes and is rejected as malformed.
        """
        value = self._decodeUnsignedWord(word)
        sp.verify((value < TWO_POW_63) | (value >= NEG_THRESHOLD_63), "MALFORMED_PYTH_RESPONSE")
        sp.verify(value < TWO_POW_63, "NON_POSITIVE_PYTH_PRICE")
        sp.verify(value > 0, "NON_POSITIVE_PYTH_PRICE")
        return value

    def _decodeExponentWord(self, word):
        """Decodes a canonical Pyth int32 exponent with sign-extension validation (see
        _decodePriceWord for the canonicity argument, applied here with a 32-bit width, so
        the sign-bit boundary is 2**31). The negative branch converts the FULL 256-bit
        decoded word to its signed value by subtracting 2**256 (the word's own width), not
        2**32 -- subtracting 2**32 would leave the untouched high 224 bits in place and
        produce an enormous positive number instead of e.g. -8. NOTE: the branch result is
        assigned to an sp.local and returned once at the end, rather than using a bare
        `return` inside `sp.if`/`sp.else` -- a `return` there is NOT a conditional return in
        this SmartPy toolchain: it always takes whichever branch is traced first, regardless
        of the runtime condition, silently discarding the other branch."""
        value = self._decodeUnsignedWord(word)
        sp.verify((value < TWO_POW_31) | (value >= NEG_THRESHOLD_31), "MALFORMED_PYTH_RESPONSE")
        exponentResult = sp.local("exponentResult", sp.int(0))
        sp.if value >= NEG_THRESHOLD_31:
            exponentResult.value = sp.to_int(value) - 2 ** 256
        sp.else:
            exponentResult.value = sp.to_int(value)
        return exponentResult.value

    def _decodePublishTimeWord(self, word):
        """Decodes Pyth's uint256 publish time."""
        return self._decodeUnsignedWord(word)

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
            Pins Pyth feed ids, their target nat precision (decimals) and a mandatory
            per-feed max confidence limit (basis points of raw price) per base asset symbol
        """
        sp.verify(self.is_admin(sp.sender), message="NOT_ADMIN")
        sp.set_type(params, sp.TList(sp.TRecord(
            asset=sp.TString, feedId=sp.TBytes, targetDecimals=sp.TNat,
            maxConfidenceBps=sp.TNat)))
        sp.for item in params:
            sp.verify(sp.len(item.feedId) == 32, "INVALID_PYTH_FEED_ID")
            sp.verify(item.targetDecimals <= MAX_TARGET_DECIMALS,
                      "INVALID_TARGET_DECIMALS")
            # A limit of 0 would make the feed permanently unusable (rejecting every quote),
            # which is indistinguishable from "no approved limit" -- disallow it outright
            # rather than let it silently masquerade as a configured feed.
            sp.verify((item.maxConfidenceBps > 0) & (item.maxConfidenceBps <= BPS_DENOMINATOR),
                      "INVALID_PYTH_CONFIDENCE_LIMIT")
            self.data.feedIds[item.asset] = sp.record(
                feedId=item.feedId, targetDecimals=item.targetDecimals,
                maxConfidenceBps=item.maxConfidenceBps)

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

            # Pyth prices must be strictly positive. Decode this ABI word as unsigned after
            # rejecting a set sign bit; this avoids relying on the larger contract's repeated
            # signed-word lambda expansion while preserving fail-closed handling of negatives.
            rawPrice = sp.to_int(self._decodePriceWord(priceWord))
            rawConf = self._decodeUint64Word(confWord)
            rawExpo = self._decodeExponentWord(expoWord)
            # publishTime is `uint` (uint256) per pyth-sdk-solidity's PythStructs.Price, not signed;
            # the <= sp.now check below still fails closed on any absurdly large decoded value.
            rawPublishTime = self._decodePublishTimeWord(publishTimeWord)

            sp.verify(rawPrice > 0, "NON_POSITIVE_PYTH_PRICE")
            sp.verify((rawExpo >= -30) & (rawExpo <= 0), "INVALID_PYTH_EXPONENT")
            sp.verify(rawPublishTime > 0, "INVALID_PYTH_PUBLISH_TIME")

            publishTimestamp = sp.timestamp(0).add_seconds(sp.to_int(rawPublishTime))
            sp.verify(publishTimestamp <= sp.now, "FUTURE_PYTH_PUBLISH_TIME")

            priceNat = sp.as_nat(rawPrice, message="NON_POSITIVE_PYTH_PRICE")
            # Fail closed if the reported confidence interval exceeds this feed's own mandatory
            # limit (no shared/implicit fallback limit across feeds).
            sp.verify(rawConf * BPS_DENOMINATOR <= priceNat * feedConfig.maxConfidenceBps,
                      "EXCESSIVE_PYTH_CONFIDENCE")

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