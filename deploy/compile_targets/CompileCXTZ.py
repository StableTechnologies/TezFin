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
            "name": "TezFin Interest-Bearing XTZ",
            "description": "Interest-bearing token for Tez (XTZ) supplied to the TezFin lending protocol.",
            "version": "3.0",
            "authors": ["Tezos Finance Protocol"],
            "homepage": "https://tezos.finance",
            "interfaces": ["TZIP-007", "TZIP-016"],
        }))
    }),
    token_metadata_ = {
        "name": sp.utils.bytes_of_string("TezFin Interest-Bearing XTZ"),
        "symbol": sp.utils.bytes_of_string("\ua730XTZ"),
        "decimals": sp.utils.bytes_of_string("6"),
    }
))
