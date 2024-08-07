import smartpy as sp

Exponential = sp.io.import_script_from_url("file:contracts/utils/Exponential.py", name="Exponential")

class ExponentialTestContract(Exponential.Exponential):
    def __init__(self):
        Exponential.Exponential.__init__(self, result=sp.nat(0))

    @sp.entry_point
    def testAddExp(self, a, b):
        self.data.result = self.add_exp_exp(a, b).mantissa

    @sp.entry_point
    def testAddExpNat(self, a, b):
        self.data.result = self.add_exp_nat(a, b).mantissa

    @sp.entry_point
    def testSubNatNat(self, a, b):
        self.data.result = self.sub_nat_nat(a, b)

    @sp.entry_point
    def testSubExpExp(self, a, b):
        self.data.result = self.sub_exp_exp(a, b).mantissa

    @sp.entry_point
    def testMulExpExp(self, a, b):
        self.data.result = self.mul_exp_exp(a, b).mantissa

    @sp.entry_point
    def testMulExpNat(self, a, b):
        self.data.result = self.mul_exp_nat(a, b).mantissa

    @sp.entry_point
    def testMulNatExp(self, a, b):
        self.data.result = self.mul_nat_exp(a, b)

    @sp.entry_point
    def testDivExpExp(self, a, b):
        self.data.result = self.div_exp_exp(a, b).mantissa

    @sp.entry_point
    def testDivExpNat(self, a, b):
        self.data.result = self.div_exp_nat(a, b).mantissa

    @sp.entry_point
    def testDivNatExp(self, a, b):
        self.data.result = self.div_nat_exp(a, b)

    @sp.entry_point
    def testDivNatExpCeil(self, a, b):
        self.data.result = self.div_nat_exp_ceil(a, b)

    @sp.entry_point
    def testTruncate(self, params):
        self.data.result = self.truncate(params.a)

    @sp.entry_point
    def testMulScalarTruncate(self, a, scalar):
        self.data.result = self.mulScalarTruncate(a, scalar)

    @sp.entry_point
    def testMulScalarTruncateAdd(self, a, scalar, addend):
        self.data.result = self.mulScalarTruncateAdd(a, scalar, addend)
        
    @sp.entry_point
    def testMulExpRounded(self, a, b):
        self.data.result = self.mulExpRounded(a, b).mantissa
        
    @sp.entry_point
    def testLessThanExp(self, a, b):
        sp.if self.lessThanExp(a, b):
            self.data.result = sp.nat(1)
        sp.else:
            self.data.result = sp.nat(0)
        
    @sp.entry_point
    def testLessThanOrEqualExp(self, a, b):
        sp.if self.lessThanOrEqualExp(a, b):
            self.data.result = sp.nat(1)
        sp.else:
            self.data.result = sp.nat(0)


@sp.add_test(name = "Exponential_Tests")
def test():
    expScale = sp.nat(int(1e18))
    n1 = sp.nat(2)
    n2 = sp.nat(6)
    n4 = sp.nat(1)
    n3 = sp.nat(1500000000000000000)
    e1 = sp.record(mantissa=(n1 * expScale))
    e2 = sp.record(mantissa=(n2 * expScale))
    e3 = sp.record(mantissa=(n3)) # real number 1.5
    b1 = sp.record(mantissa=(n1 * expScale * expScale * expScale * expScale))
    b2 = sp.record(mantissa=(n2 * expScale * expScale * expScale * expScale))


    scenario = sp.test_scenario()
    scenario.add_flag("protocol", "lima")

    scenario.table_of_contents()
    scenario.h1("Exponential math tests")

    c1 = ExponentialTestContract()
    scenario += c1

    scenario.h2("Test add")
    scenario.h3("Add Exp + Exp")
    scenario += c1.testAddExp(a=e1, b=e2)
    scenario.verify(c1.data.result == sp.nat(8) * expScale)
    scenario.h3("Add Exp + Exp : big numbers")
    scenario += c1.testAddExp(a=b1, b=b2)
    scenario.verify(c1.data.result == sp.nat(8000000000000000000000000000000000000000000000000000000) * expScale)
    scenario.h3("Add Exp + Nat")
    scenario += c1.testAddExpNat(a=e1, b=n2)
    scenario.verify(c1.data.result == sp.nat(8) * expScale)

    scenario.h2("Test sub")
    scenario.h3("Sub Nat - Nat")
    scenario += c1.testSubNatNat(a=n2, b=n1)
    scenario.verify(c1.data.result == sp.nat(4))
    scenario.h3("Sub Nat - Nat : underflow")
    scenario += c1.testSubNatNat(a=n1, b=n2).run(valid=False)
    scenario.h3("Sub Exp - Exp")
    scenario += c1.testSubExpExp(a=e2, b=e1)
    scenario.verify(c1.data.result == sp.nat(4) * expScale)

    scenario.h2("Test mul")
    scenario.h3("Mul Exp * Exp")
    scenario += c1.testMulExpExp(a=e1, b=e2)
    scenario.verify(c1.data.result == sp.nat(12) * expScale)
    scenario.h3("Mul Exp * Exp : big numbers")
    scenario += c1.testMulExpExp(a=b1, b=b2)
    scenario.verify(c1.data.result == sp.nat(12000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000) * expScale)
    scenario.h3("Mul Exp * Nat")
    scenario += c1.testMulExpNat(a=e1, b=n2)
    scenario.verify(c1.data.result == sp.nat(12) * expScale)
    scenario.h3("Mul Nat * Exp")
    scenario += c1.testMulNatExp(a=n1, b=e3)
    scenario.verify(c1.data.result == sp.nat(3))

    scenario.h2("Test div")
    scenario.h3("Div Exp / Exp")
    scenario += c1.testDivExpExp(a=e2, b=e1)
    scenario.verify(c1.data.result == sp.nat(3) * expScale)
    scenario.h3("Div Exp / Exp : big divisor")
    scenario += c1.testDivExpExp(a=e1, b=b2)
    scenario.verify(c1.data.result == sp.nat(0))
    scenario.h3("Div Exp / Exp : divide by zero")
    scenario += c1.testDivExpExp(a=e2, b=sp.record(mantissa=sp.nat(0))).run(valid=False)
    scenario.h3("Div Exp / Nat")
    scenario += c1.testDivExpNat(a=e2, b=sp.nat(4))
    scenario.verify(c1.data.result == n3)
    scenario.h3("Div Exp / Nat : divide by zero")
    scenario += c1.testDivExpNat(a=e2, b=sp.nat(0)).run(valid=False)
    scenario.h3("Div Nat / Exp")
    scenario += c1.testDivNatExp(a=n2, b=e3)
    scenario.verify(c1.data.result == sp.nat(4))
    scenario.h3("Div Nat / Exp : divide by zero")
    scenario += c1.testDivNatExp(a=n2, b=sp.record(mantissa=sp.nat(0))).run(valid=False)
    scenario.h3("Div Nat / Exp With Ceil")
    # normal div gives 0
    scenario += c1.testDivNatExp(a=n4, b=e3)
    scenario.verify(c1.data.result == sp.nat(0))
    # ceil dive gives 1
    scenario += c1.testDivNatExpCeil(a=n4, b=e3)
    scenario.verify(c1.data.result == sp.nat(1))
    scenario.h3("Div Nat / Exp With Ceil : divide by zero")
    scenario += c1.testDivNatExpCeil(a=n4, b=sp.record(mantissa=sp.nat(0))).run(valid=False)

    scenario.h2("Test truncate")
    scenario.h3("Truncate integer")
    scenario += c1.testTruncate(a=e2)
    scenario.verify(c1.data.result == n2)
    scenario.h3("Truncate small number")
    scenario += c1.testTruncate(a=sp.record(mantissa=n2))
    scenario.verify(c1.data.result == sp.nat(0))
    scenario.h3("Truncate real")
    scenario += c1.testTruncate(a=e3)
    scenario.verify(c1.data.result == sp.nat(1))

    scenario.h2("Test mul scalar truncate")
    scenario.h3("Mul real and truncate float")
    scenario += c1.testMulScalarTruncate(a=e3, scalar=sp.nat(3))
    scenario.verify(c1.data.result == sp.nat(4))
    scenario.h3("Mul real, truncate float and add Nat")
    scenario += c1.testMulScalarTruncateAdd(a=e3, scalar=sp.nat(3), addend=n1)
    scenario.verify(c1.data.result == sp.nat(6))

    scenario.h2("Test mul rounded")
    scenario.h3("Mul rounded, truncate integer")
    scenario += c1.testMulExpRounded(a=e1, b=e2)
    scenario.verify(c1.data.result == sp.nat(12) * expScale)
    scenario.h3("Mul rounded, round up")
    scenario += c1.testMulExpRounded(a=sp.record(mantissa=sp.nat(6)), b=sp.record(mantissa=sp.nat(6600000000000000000)))
    scenario.verify(c1.data.result == sp.nat(40)) # 39.6 rounded up to 40
    scenario.h3("Mul rounded, round down")
    scenario += c1.testMulExpRounded(a=sp.record(mantissa=sp.nat(4)), b=sp.record(mantissa=sp.nat(6600000000000000000)))
    scenario.verify(c1.data.result == sp.nat(26)) # 26.4 rounded down to 26

    scenario.h2("Test less than")
    scenario.h3("Left less than right")
    scenario += c1.testLessThanExp(a=e1, b=e2)
    scenario.verify(c1.data.result == sp.nat(1))
    scenario.h3("Left equal to right")
    scenario += c1.testLessThanExp(a=e1, b=e1)
    scenario.verify(c1.data.result == sp.nat(0))
    scenario.h3("Left greater than right")
    scenario += c1.testLessThanExp(a=e2, b=e1)
    scenario.verify(c1.data.result == sp.nat(0))

    scenario.h2("Test less than or equal")
    scenario.h3("Left less than right")
    scenario += c1.testLessThanOrEqualExp(a=e1, b=e2)
    scenario.verify(c1.data.result == sp.nat(1))
    scenario.h3("Left equal to right")
    scenario += c1.testLessThanOrEqualExp(a=e1, b=e1)
    scenario.verify(c1.data.result == sp.nat(1))
    scenario.h3("Left greater than right")
    scenario += c1.testLessThanOrEqualExp(a=e2, b=e1)
    scenario.verify(c1.data.result == sp.nat(0))
