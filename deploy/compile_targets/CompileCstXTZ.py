import smartpy as sp
import json

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
CFA2 = sp.io.import_script_from_url("file:contracts/CFA2.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.CFA2)

sp.add_compilation_target("CstXTZ", CFA2.CFA2(
    comptroller_ = sp.address(""),
    interestRateModel_ = sp.address(""),
    initialExchangeRateMantissa_ = sp.nat(CFG.CFA2.initialExchangeRateMantissa),
    administrator_ = sp.address(""),
    # specify metadata before compilation
    metadata_ = sp.big_map({
        "": sp.utils.bytes_of_string("tezos-storage:data"),
        "data": sp.utils.bytes_of_string(json.dumps({
            "name": "TezFin Interest-Bearing stXTZ",
            "description": "Interest-bearing token for stXTZ supplied to the TezFin lending protocol",
            "version": "3.0",
            "authors": ["Tezos Finance Protocol"],
            "homepage": "https://tezos.finance",
            "interfaces": ["TZIP-007", "TZIP-016"],
        }))
    }),
    token_metadata_ = {
        "name": sp.utils.bytes_of_string("TezFin Interest-Bearing stXTZ"),
        "symbol": sp.utils.bytes_of_string("\ua730stXTZ"),
        "decimals": sp.utils.bytes_of_string("6"),
    },
    fa2_TokenAddress_ = sp.address(""),
    tokenId_ = sp.nat(0)
    ))
