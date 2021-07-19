import smartpy as sp

Governance = sp.io.import_script_from_url("file:contracts/Governance.py")
CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")
UTILS = sp.io.import_script_from_url("file:deploy/compile_targets/Utils.py")

UTILS.checkDependencies(CFG.Governance)

sp.add_compilation_target("Governance", Governance.Governance(sp.address(CFG.deployResult.OriginatorAddress)))
