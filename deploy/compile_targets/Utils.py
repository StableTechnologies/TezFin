import smartpy as sp

CFG = sp.io.import_script_from_url("file:deploy/compile_targets/Config.py")

def checkDependencies(obj):
    notSpecifiedAttributes = []
    for attribute in obj.dependencies:
        if not hasattr(CFG.deployResult, attribute):
            notSpecifiedAttributes.append(attribute)

    if len(notSpecifiedAttributes) > 0:
        raise Exception(f'Please specify {notSpecifiedAttributes} in {CFG.PATH_DEPLOY_RESULT}')
