import smartpy as sp
import json

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CFA12 = sp.io.import_script_from_url("file:contracts/CFA12.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CFA12)

sp.add_compilation_target("CtzBTC", CFA12.CFA12(
    comptroller_ = sp.address(CFG.deployResult.Comptroller),
    interestRateModel_ = sp.address(CFG.deployResult.CFA12_IRM),
    initialExchangeRateMantissa_ = sp.nat(CFG.CFA2.initialExchangeRateMantissa),
    administrator_ = sp.address(CFG.deployResult.Governance),
    # specify metadata before deployment
    metadata_ = sp.big_map({
        "": sp.utils.bytes_of_string("tezos-storage:data"),
        "data": sp.utils.bytes_of_string(json.dumps({
            "name": "TezFin Interest-Bearing tzBTC",
            "description": "Interest-bearing token for tzBTC (wrapped Bitcoin on Tezos) supplied to the TezFin lending protocol.",
            "version": "3.0",
            "authors": ["Tezos Finance Protocol"],
            "homepage": "https://tezos.finance",
            "interfaces": ["TZIP-007", "TZIP-016"],
        }))
    }),
    token_metadata_ = {
        "name": sp.utils.bytes_of_string("TezFin Interest-Bearing tzBTC"),
        "symbol": sp.utils.bytes_of_string("\ua730tzBTC"),
        "decimals": sp.utils.bytes_of_string("8"),
    },
    fa1_2_TokenAddress_ = sp.address(CFG.deployResult.tzBTC)
    ))
