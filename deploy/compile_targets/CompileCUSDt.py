import smartpy as sp
import json

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CFA2 = sp.io.import_script_from_url("file:contracts/CFA2.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CFA2)

sp.add_compilation_target("CUSDt", CFA2.CFA2(
    comptroller_ = sp.address(CFG.deployResult.Comptroller),
    interestRateModel_ = sp.address(CFG.deployResult.CFA2_IRM),
    initialExchangeRateMantissa_ = sp.nat(CFG.CFA2.initialExchangeRateMantissa),
    administrator_ = sp.address(CFG.deployResult.Governance),
    # specify metadata before compilation
    metadata_ = sp.big_map({
        "": sp.utils.bytes_of_string("tezos-storage:data"),
        "data": sp.utils.bytes_of_string(json.dumps({
            "name": "TezFin Interest-Bearing USD Tether",
            "description": "Interest-bearing token for USD Tether (USDt) supplied to the TezFin lending protocol.",
            "version": "3.0",
            "authors": ["Tezos Finance Protocol"],
            "homepage": "https://tezos.finance",
            "interfaces": ["TZIP-007", "TZIP-016"],
        }))
    }),
    token_metadata_ = {
        "name": sp.utils.bytes_of_string("TezFin Interest-Bearing USD Tether"),
        "symbol": sp.utils.bytes_of_string("\ua730USDt"),
        "decimals": sp.utils.bytes_of_string("6"),
    },
    fa2_TokenAddress_ = sp.address(CFG.deployResult.USDt),
    tokenId_ = sp.nat(CFG.CFA2.tokenId)
    ))
