import json
import os
from types import SimpleNamespace

PATH_COMPILE_CONFIG = "deploy/compile_targets/Config.json"
PATH_DEPLOY_RESULT = "TezFinBuild/deploy_result/deploy.json"

class JsonDeserializer:
    # order to formulate correct path, execution must be started from root directory "TezFin"
    _scriptDir = os.path.dirname(os.path.abspath("__file__"))
    
    @staticmethod
    def Deserialize(relativePath):
        with open(os.path.join(JsonDeserializer._scriptDir, relativePath)) as file:
            # parse JSON into an object with attributes corresponding to dict keys
            return json.loads(file.read(), object_hook=lambda d: SimpleNamespace(**d))

compileConfig = JsonDeserializer.Deserialize(PATH_COMPILE_CONFIG)
# Use a network-specific manifest when set, so Previewnet/mainnet deploy results are
# never read from (or written to) the same tracked file. Falls back to the legacy
# E2E override, then to the tracked Previewnet-only default.
deployResult = JsonDeserializer.Deserialize(
    os.getenv('DEPLOY_MANIFEST', os.getenv('E2E', PATH_DEPLOY_RESULT)))

CUSDt_IRM = compileConfig.CUSDt_IRM
CUSDtz_IRM = compileConfig.CUSDtz_IRM
CtzBTC_IRM = compileConfig.CtzBTC_IRM
CstXTZ_IRM = compileConfig.CstXTZ_IRM
CXTZ_IRM = compileConfig.CXTZ_IRM

Governance = compileConfig.Governance
Comptroller = compileConfig.Comptroller
CFA2 = compileConfig.CFA2
CFA12 = compileConfig.CFA12
CXTZ = compileConfig.CXTZ
FA12 = compileConfig.FA12
FA2 = compileConfig.FA2
