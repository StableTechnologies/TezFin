import smartpy as sp
import os

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

def checkDependencies(obj):
    notSpecifiedAttributes = []
    for attribute in obj.dependencies:
        if not hasattr(CFG.deployResult, attribute):
            notSpecifiedAttributes.append(attribute)

    if len(notSpecifiedAttributes) > 0:
        manifest = os.getenv('DEPLOY_MANIFEST', os.getenv('E2E', CFG._defaultDeployResultPath))
        message = f'Please specify {notSpecifiedAttributes} in the deploy manifest ({manifest}).'
        if 'PriceOracle' in notSpecifiedAttributes:
            message += (
                ' For Previewnet, deploy the mock PriceOracle via CompileTestData.py first. '
                'For mainnet, put the vetted production oracle address under PriceOracle before compiling.'
            )
        raise Exception(message)
