import json
import os
from types import SimpleNamespace

PATH_COMPILE_CONFIG = "deploy/compile_targets/Config.json"
PATH_DEPLOY_SCRIPT_CONFIG = "deploy/deploy_script/config.json"
PATH_DEPLOY_RESULT = "TezFinBuild/deploy_result/deploy.json"
PATH_DEPLOY_RESULT_MAINNET = "TezFinBuild/deploy_result/deploy.mainnet.json"

class JsonDeserializer:
    # order to formulate correct path, execution must be started from root directory "TezFin"
    _scriptDir = os.path.dirname(os.path.abspath("__file__"))
    
    @staticmethod
    def Deserialize(relativePath):
        with open(os.path.join(JsonDeserializer._scriptDir, relativePath)) as file:
            # parse JSON into an object with attributes corresponding to dict keys
            return json.loads(file.read(), object_hook=lambda d: SimpleNamespace(**d))

compileConfig = JsonDeserializer.Deserialize(PATH_COMPILE_CONFIG)
deployScriptConfig = JsonDeserializer.Deserialize(PATH_DEPLOY_SCRIPT_CONFIG)

# Manifest path resolution must match resolveDeployResultPath() in deploy_script/util.js
# exactly, otherwise prepare/deploy (JS) and compile targets (this file) can silently
# read/write different manifests for the same run:
#   1. DEPLOY_MANIFEST env var, if set (explicit override always wins).
#   2. A profile-specific default derived from deploy_script/config.json's
#      networkProfile, so a mainnet config.json never defaults to the Previewnet
#      manifest file (or vice versa).
_defaultDeployResultPath = (
    PATH_DEPLOY_RESULT_MAINNET
    if getattr(deployScriptConfig, 'networkProfile', None) == 'mainnet'
    else PATH_DEPLOY_RESULT
)
deployResult = JsonDeserializer.Deserialize(
    os.getenv('DEPLOY_MANIFEST', os.getenv('E2E', _defaultDeployResultPath)))

CUSDt_IRM = compileConfig.CUSDt_IRM
CUSDtz_IRM = compileConfig.CUSDtz_IRM
CtzBTC_IRM = compileConfig.CtzBTC_IRM
CstXTZ_IRM = compileConfig.CstXTZ_IRM
CXTZ_IRM = compileConfig.CXTZ_IRM
CXTZ_AdjustedIRM = compileConfig.CXTZ_AdjustedIRM

Governance = compileConfig.Governance
Comptroller = compileConfig.Comptroller
TezFinOracle = compileConfig.TezFinOracle
CFA2 = compileConfig.CFA2
CFA12 = compileConfig.CFA12
CXTZ = compileConfig.CXTZ
FA12 = compileConfig.FA12
FA2 = compileConfig.FA2
