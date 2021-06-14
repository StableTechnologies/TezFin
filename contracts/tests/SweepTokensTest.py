import smartpy as sp

SweepTokens = sp.io.import_script_from_url("file:contracts/utils/SweepTokens.py")
FA12Mock = sp.io.import_script_from_url("file:contracts/tests/mock/FA12Mock.py")

class TestSweepTokens(SweepTokens.SweepTokens):
    def __init__(self, admin):
        self.init(administrator = admin)

    @sp.entry_point
    def verifyMutezBalance(self, value):
        sp.verify(sp.utils.mutez_to_nat(sp.balance) == value)


@sp.add_test(name = "SweepTokens_Tests")
def test():
    admin = sp.test_account("admin")

    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "florence")

    scenario.table_of_contents()
    scenario.h1("SweepTokens tests")

    fa12 = FA12Mock.FA12Mock()
    c1 = TestSweepTokens(admin.address)

    scenario += fa12
    scenario += c1


    scenario.h2("sweepFA12")
    scenario += fa12.mint(sp.record(address = c1.address, value = 1000))
    scenario += c1.sweepFA12(sp.record(tokenAddress = fa12.address, amount = 600))
    scenario.verify(fa12.data.balances[c1.address].balance == 400)
    scenario.verify(fa12.data.balances[admin.address].balance == 600)

    scenario.h2("sweepFA12 insufficient")
    scenario += c1.sweepFA12(sp.record(tokenAddress = fa12.address, amount = 600)).run(valid=False)

    scenario.h2("sweepMutez")
    scenario += c1.verifyMutezBalance(100).run(amount=sp.mutez(100))
    scenario += c1.sweepMutez()
    scenario += c1.verifyMutezBalance(0)
