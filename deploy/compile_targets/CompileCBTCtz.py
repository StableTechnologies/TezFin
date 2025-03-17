import smartpy as sp
import json

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CFA2 = sp.io.import_script_from_url("file:contracts/CFA2.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CFA2)

sp.add_compilation_target("CBTCtz", CFA2.CFA2(
    comptroller_ = sp.address(CFG.deployResult.Comptroller),
    interestRateModel_ = sp.address(CFG.deployResult.CFA2_IRM),
    initialExchangeRateMantissa_ = sp.nat(CFG.CFA2.initialExchangeRateMantissa),
    administrator_ = sp.address(CFG.deployResult.Governance),
    # specify metadata before compilation
    metadata_ = sp.big_map({
        "": sp.utils.bytes_of_string("tezos-storage:data"),
        "data": sp.utils.bytes_of_string(json.dumps({
            "name": "...",
            "description": "...",
            "version": "1.0.0",
            "authors": ["..."],
            "homepage": "https://some-website.com",
            "interfaces": ["TZIP-007"],
            "license": {"name": "..."}
        }))
    }),
    token_metadata_ = {
        "name": sp.utils.bytes_of_string("Compound XTZ"),
        "symbol": sp.utils.bytes_of_string("fXTZ"),
        "decimals": sp.utils.bytes_of_string("..."),
    },
    fa2_TokenAddress_ = sp.address(CFG.deployResult.BTCtz),
    tokenId_ = sp.nat(CFG.CFA2.tokenId)
    ))
