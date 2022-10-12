def checkAdminRequirementH4(scenario, actionText, bLevel, adminAccount, nonAdminAccount, callableObj, arg, **runOptions):
    scenario.h4(f'Common user attempts to {actionText}')
    scenario += callableObj(arg).run(sender = nonAdminAccount, level = bLevel.current(), valid = False, **runOptions)

    scenario.h4(f'Admin attempts to {actionText}')
    scenario += callableObj(arg).run(sender = adminAccount, level = bLevel.current(), **runOptions)
