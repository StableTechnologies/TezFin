import smartpy as sp

TezFinOracle = sp.io.import_script_from_url(
    "file:contracts/TezFinOracle.py").TezFinOracle
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

# Fails early and explicitly (instead of a bare AttributeError) if PriceOracle hasn't
# been compiled/deployed yet for this network profile. See CompileTestData.py (Previewnet
# mock) and README.md ("Deployment Manifest" / PriceOracle) for how PriceOracle should be
# supplied for each network.
UTILS.checkDependencies(CFG.TezFinOracle)

sp.add_compilation_target("TezFinOracle", TezFinOracle(
    admin=sp.address(CFG.deployResult.OriginatorAddress),
    oracle=sp.address(CFG.deployResult.PriceOracle)))
