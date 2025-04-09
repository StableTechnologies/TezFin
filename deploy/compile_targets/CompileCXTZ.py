import smartpy as sp
import json

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CXTZ = sp.io.import_script_from_url("file:contracts/CXTZ.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CXTZ)

sp.add_compilation_target("CXTZ", CXTZ.CXTZ(
    comptroller_ = sp.address(CFG.deployResult.Comptroller),
    interestRateModel_ = sp.address(CFG.deployResult.CXTZ_IRM),
    administrator_ = sp.address(CFG.deployResult.Governance),
    # specify metadata before compilation
    metadata_ = sp.big_map({
        "": sp.utils.bytes_of_string("tezos-storage:data"),
        "data": sp.utils.bytes_of_string(json.dumps({
            "name": "Compount XTZ contract",
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
        "decimals": sp.utils.bytes_of_string("6"),
    }
))
