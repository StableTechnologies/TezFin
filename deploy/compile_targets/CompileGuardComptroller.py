import smartpy as sp

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
GC = sp.io.import_script_from_url("file:contracts/GuardComptroller.py")

# Originate with the current market set so repay/redeem work immediately.
# Optional names (e.g. CstXTZ) are included when present in deploy.json.
_MARKET_KEYS = ("CXTZ", "CUSDtz", "CUSDt", "CtzBTC", "CstXTZ")
_markets = [
    sp.address(getattr(CFG.deployResult, key))
    for key in _MARKET_KEYS
    if hasattr(CFG.deployResult, key)
]

sp.add_compilation_target(
    "GuardComptroller",
    GC.GuardComptroller(
        administrator_=sp.address(CFG.deployResult.Governance),
        markets_=_markets,
        approvedRollbackComptroller_=sp.address(CFG.deployResult.Comptroller)
        if hasattr(CFG.deployResult, "Comptroller") else None,
    ),
)
