import smartpy as sp
import json

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CFA12 = sp.io.import_script_from_url("file:contracts/CFA12.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CFA12)

sp.add_compilation_target("CUSDtz", CFA12.CFA12(
    comptroller_ = sp.address(CFG.deployResult.Comptroller),
    interestRateModel_ = sp.address(CFG.deployResult.CFA12_IRM),
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
        "name": sp.utils.bytes_of_string("..."),
        "symbol": sp.utils.bytes_of_string("..."),
        "decimals": sp.utils.bytes_of_string("..."),
    },
    fa1_2_TokenAddress_ = sp.address(CFG.deployResult.USDtz)
    ))
