import smartpy as sp


NAC_GATEWAY = sp.address("KT18oDJJKXMKhfE1bSuAPGp92pYcwVDiqsPw")
TNacRequest = sp.TPair(sp.TString, sp.TBytes)
BYTE_TO_NAT = sp.map(
    l={sp.bytes("0x%02x" % i): i for i in range(256)},
    tkey=sp.TBytes,
    tvalue=sp.TNat,
)


class NacProbe(sp.Contract):
    """Test-only raw NAC probe; intentionally performs no ABI decoding."""

    def __init__(self):
        self.init()

    @sp.onchain_view()
    def rawPythResponse(self, params):
        sp.set_type(params, TNacRequest)
        response = sp.view(
            "staticcall_evm",
            NAC_GATEWAY,
            params,
            t=sp.TBytes,
        ).open_some("NAC_STATICCALL_FAILED")
        sp.result(response)

    @sp.onchain_view()
    def decodedPrice(self, params):
        sp.set_type(params, TNacRequest)
        response = sp.view(
            "staticcall_evm",
            NAC_GATEWAY,
            params,
            t=sp.TBytes,
        ).open_some("NAC_STATICCALL_FAILED")
        word = sp.slice(response, 0, 32).open_some("MALFORMED_RESPONSE")
        acc = sp.local("acc", sp.nat(0))
        byteIndex = sp.local("byteIndex", sp.nat(0))
        sp.while byteIndex.value < 32:
            current_byte = sp.slice(word, byteIndex.value, 1).open_some("MALFORMED_RESPONSE")
            acc.value = acc.value * 256 + BYTE_TO_NAT[current_byte]
            byteIndex.value += 1
        sp.result(sp.to_int(acc.value))

    @sp.onchain_view()
    def decodedSignedPrice(self, params):
        sp.set_type(params, TNacRequest)
        response = sp.view(
            "staticcall_evm",
            NAC_GATEWAY,
            params,
            t=sp.TBytes,
        ).open_some("NAC_STATICCALL_FAILED")
        word = sp.slice(response, 0, 32).open_some("MALFORMED_RESPONSE")
        unsignedValue = sp.local("unsignedValue", sp.nat(0))
        byteIndex = sp.local("byteIndex", sp.nat(0))
        sp.while byteIndex.value < 32:
            currentByte = sp.slice(word, byteIndex.value, 1).open_some(
                "MALFORMED_RESPONSE")
            unsignedValue.value = unsignedValue.value * 256 + BYTE_TO_NAT[currentByte]
            byteIndex.value += 1
        signByte = sp.slice(word, 0, 1).open_some("MALFORMED_RESPONSE")
        signedValue = sp.local("signedValue", sp.int(0))
        sp.if BYTE_TO_NAT[signByte] >= 128:
            signedValue.value = sp.to_int(unsignedValue.value) - sp.to_int(2 ** 256)
        sp.else:
            signedValue.value = sp.to_int(unsignedValue.value)
        sp.result(signedValue.value)

    @sp.onchain_view()
    def decodedConfidence(self, params):
        sp.set_type(params, TNacRequest)
        response = sp.view(
            "staticcall_evm",
            NAC_GATEWAY,
            params,
            t=sp.TBytes,
        ).open_some("NAC_STATICCALL_FAILED")
        word = sp.slice(response, 32, 32).open_some("MALFORMED_RESPONSE")
        confidence = sp.local("confidence", sp.nat(0))
        byteIndex = sp.local("byteIndex", sp.nat(0))
        sp.while byteIndex.value < 32:
            currentByte = sp.slice(word, byteIndex.value, 1).open_some(
                "MALFORMED_RESPONSE")
            confidence.value = confidence.value * 256 + BYTE_TO_NAT[currentByte]
            byteIndex.value += 1
        sp.result(confidence.value)


sp.add_compilation_target("NacProbe", NacProbe())