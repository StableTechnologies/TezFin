import smartpy as sp

class Contract(sp.Contract):
  def __init__(self):
    self.init_type(sp.TRecord(expScale = sp.TNat, halfExpScale = sp.TNat, result = sp.TNat).layout(("expScale", ("halfExpScale", "result"))))
    self.init(expScale = 1000000000000000000,
              halfExpScale = 500000000000000000,
              result = 0)

  @sp.entry_point
  def testAddExp(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.a.mantissa + params.b.mantissa, sp.TNat)
    self.data.result = params.a.mantissa + params.b.mantissa

  @sp.entry_point
  def testAddExpNat(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TNat)
    sp.set_type(params.a.mantissa + (params.b * self.data.expScale), sp.TNat)
    self.data.result = params.a.mantissa + (params.b * self.data.expScale)

  @sp.entry_point
  def testDivExpExp(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.verify(params.b.mantissa > 0, 'DIVISION_BY_ZERO')
    sp.set_type((params.a.mantissa * self.data.expScale) // params.b.mantissa, sp.TNat)
    self.data.result = (params.a.mantissa * self.data.expScale) // params.b.mantissa

  @sp.entry_point
  def testDivExpNat(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TNat)
    sp.verify(params.b > 0, 'DIVISION_BY_ZERO')
    sp.set_type(params.a.mantissa // params.b, sp.TNat)
    self.data.result = params.a.mantissa // params.b

  @sp.entry_point
  def testDivNatExp(self, params):
    sp.set_type(params.a, sp.TNat)
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.verify(params.b.mantissa > 0, 'DIVISION_BY_ZERO')
    self.data.result = (params.a * self.data.expScale) // params.b.mantissa

  @sp.entry_point
  def testDivNatExpCeil(self, params):
    sp.set_type(params.a, sp.TNat)
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.verify(params.b.mantissa > 0, 'DIVISION_BY_ZERO')
    compute_Exponential_277 = sp.local("compute_Exponential_277", params.a * self.data.expScale)
    compute_Exponential_280 = sp.local("compute_Exponential_280", compute_Exponential_277.value // params.b.mantissa)
    sp.if (compute_Exponential_277.value % params.b.mantissa) > 0:
      pass
    self.data.result = compute_Exponential_280.value + 1

  @sp.entry_point
  def testLessThanExp(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.if params.a.mantissa < params.b.mantissa:
      self.data.result = 1
    sp.else:
      self.data.result = 0

  @sp.entry_point
  def testLessThanOrEqualExp(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.if params.a.mantissa <= params.b.mantissa:
      self.data.result = 1
    sp.else:
      self.data.result = 0

  @sp.entry_point
  def testMulExpExp(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type((params.a.mantissa * params.b.mantissa) // self.data.expScale, sp.TNat)
    self.data.result = (params.a.mantissa * params.b.mantissa) // self.data.expScale

  @sp.entry_point
  def testMulExpNat(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TNat)
    sp.set_type(params.a.mantissa * params.b, sp.TNat)
    self.data.result = params.a.mantissa * params.b

  @sp.entry_point
  def testMulExpRounded(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(((params.a.mantissa * params.b.mantissa) + self.data.halfExpScale) // self.data.expScale, sp.TNat)
    self.data.result = ((params.a.mantissa * params.b.mantissa) + self.data.halfExpScale) // self.data.expScale

  @sp.entry_point
  def testMulNatExp(self, params):
    sp.set_type(params.a, sp.TNat)
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.result = (params.a * params.b.mantissa) // self.data.expScale

  @sp.entry_point
  def testMulScalarTruncate(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.scalar, sp.TNat)
    sp.set_type(params.a.mantissa * params.scalar, sp.TNat)
    sp.set_type(sp.record(mantissa = params.a.mantissa * params.scalar), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.result = (params.a.mantissa * params.scalar) // self.data.expScale

  @sp.entry_point
  def testMulScalarTruncateAdd(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.scalar, sp.TNat)
    sp.set_type(params.addend, sp.TNat)
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.scalar, sp.TNat)
    sp.set_type(params.a.mantissa * params.scalar, sp.TNat)
    sp.set_type(sp.record(mantissa = params.a.mantissa * params.scalar), sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.result = ((params.a.mantissa * params.scalar) // self.data.expScale) + params.addend

  @sp.entry_point
  def testSubExpExp(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.b, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    sp.set_type(params.a.mantissa, sp.TNat)
    sp.set_type(params.b.mantissa, sp.TNat)
    sp.set_type(sp.as_nat(params.a.mantissa - params.b.mantissa, message = 'SUBTRACTION_UNDERFLOW'), sp.TNat)
    self.data.result = sp.as_nat(params.a.mantissa - params.b.mantissa, message = 'SUBTRACTION_UNDERFLOW')

  @sp.entry_point
  def testSubNatNat(self, params):
    sp.set_type(params.a, sp.TNat)
    sp.set_type(params.b, sp.TNat)
    self.data.result = sp.as_nat(params.a - params.b, message = 'SUBTRACTION_UNDERFLOW')

  @sp.entry_point
  def testTruncate(self, params):
    sp.set_type(params.a, sp.TRecord(mantissa = sp.TNat).layout("mantissa"))
    self.data.result = params.a.mantissa // self.data.expScale

sp.add_compilation_target("test", Contract())