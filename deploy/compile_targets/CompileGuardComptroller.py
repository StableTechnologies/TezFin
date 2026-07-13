import smartpy as sp

GC = sp.io.import_script_from_url("file:contracts/GuardComptroller.py")

# Canonical mainnet deployment values from src/util/src/const.ts.
#
# Keep these values explicit: this target is used to prepare an emergency
# mainnet origination and must not silently pick up stale addresses from
# TezFinBuild/deploy_result/deploy.json (or omit a market absent from it).
MAINNET_GOVERNANCE = sp.address("KT1QScMEtDpXSuj7z2if1EMSqaXaXPnWCxqv")
MAINNET_COMPTROLLER = sp.address("KT1P6Lryn3ikbyf5jywWBBRP5fkztE5ZafGe")
MAINNET_MARKETS = [
    # XTZ
    sp.address("KT1Gm29ynxQcS3m6Srwd77xxMhposuNvNsRV"),
    # USD
    sp.address("KT1DcgX4Lj1XYyB6yyg76gwpfCBaoUZsg5dE"),
    # USDT
    sp.address("KT1HxMHg859teFpXXCZamuPiEyJa6YfHiagn"),
    # TZBTC
    sp.address("KT1DrELZukfWQNo3J3HTUqMS9vVTjBPLT5nQ"),
    # STXTZ
    sp.address("KT1XMtNcPze6x7hxJXezdgVGjNuHsZEYu2vw"),
]

sp.add_compilation_target(
    "GuardComptroller",
    GC.GuardComptroller(
        administrator_=MAINNET_GOVERNANCE,
        markets_=MAINNET_MARKETS,
        approvedRollbackComptroller_=MAINNET_COMPTROLLER,
    ),
)
