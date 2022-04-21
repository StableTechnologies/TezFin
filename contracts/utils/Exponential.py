# Exponential math library
# Performs high precision math operation

import smartpy as sp

MathErrors = sp.io.import_script_from_url("file:contracts/errors/MathErrors.py")
EC = MathErrors.ErrorCodes

"""
    Stores decimals with a fixed precision of 18 decimal places
    Thus, if we wanted to store the 5.1, mantissa would store 5.1e18. That is:
    `TExp({mantissa: 5100000000000000000})`.
"""
TExp = sp.TRecord(mantissa=sp.TNat)


class Exponential(sp.Contract):
    def __init__(self, **extra_storage):
        scale = int(1e18)
        self.init(expScale=sp.nat(scale), halfExpScale=sp.nat(scale // 2), **extra_storage)

    """    
        Constructs TExp from the given number value, without applying expScale
        For example, makeExp(15) = Exp{mantissa: 15}

        params: 
            value: TNat
        return: TExp
    """
    def makeExp(self, value):
        sp.set_type(value, sp.TNat)
        return sp.record(mantissa=value)


    """    
        Constructs TExp from the given number value, applying expScale
        For example, makeExp(15) = Exp{mantissa: 15 * expScale}

        params: 
            value: TNat
        return: TExp
    """
    def toExp(self, value):
        sp.set_type(value, sp.TNat)
        return self.makeExp(value * self.data.expScale)


    """    
        Truncates the given exp to a whole number value.
        For example, truncate(Exp{mantissa: 15 * expScale}) = 15

        params: 
            exp: TExp
        return: TNat
    """
    def truncate(self, exp):
        sp.set_type(exp, TExp)
        return exp.mantissa // self.data.expScale


    """
        Multiply an Exp by a scalar, then truncate to return an unsigned integer.

        params: 
            a: TExp
            scalar: TNat
        return: TNat
    """
    def mulScalarTruncate(self, a, scalar):
        sp.set_type(a, TExp)
        return self.truncate(self.mul_exp_nat(a, scalar))


    """
        Multiply an Exp by a scalar, truncate, then add an to an unsigned integer, returning an unsigned integer.

        params: 
            a: TExp
            scalar: TNat
            addend: TNat
        return: TNat
    """
    def mulScalarTruncateAdd(self, a, scalar, addend):
        sp.set_type(a, TExp)
        sp.set_type(scalar, sp.TNat)
        sp.set_type(addend, sp.TNat)
        return self.mulScalarTruncate(a, scalar) + addend


    """    
        Multiply two Exp, round up to 1e-18, returning a new exponential.

        params: 
            a: TExp
            b: TExp
        return: TExp
    """
    def mulExpRounded(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, TExp)
        mul_rounded = a.mantissa * b.mantissa + self.data.halfExpScale
        return self.makeExp(mul_rounded // self.data.expScale)


    """    
        Checks if first Exp is less than second Exp.

        params: 
            a: TExp
            b: TExp
        return: bool
    """
    def lessThanExp(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, TExp)
        return a.mantissa < b.mantissa


    """    
        Checks if left Exp <= right Exp.

        params: 
            a: TExp
            b: TExp
        return: bool
    """
    def lessThanOrEqualExp(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, TExp)
        return a.mantissa <= b.mantissa



    #  Raw operations

    """    
        params: 
            a: TExp
            b: TExp
        return: TExp
    """
    def add_exp_exp(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, TExp)
        return self.makeExp(a.mantissa + b.mantissa)

    """   
        params: 
            a: TExp
            b: TNat
        return: TExp
    """
    def add_exp_nat(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, sp.TNat)
        return self.makeExp(a.mantissa + b * self.data.expScale)

    """  
        params: 
            a: TNat
            b: TNat
        return: TNat
    """

    def add_nat_nat(self, a, b):
        sp.set_type(a, sp.TNat)
        sp.set_type(b, sp.TNat)
        return a + b


    """    
        params: 
            a: TExp
            b: TExp
        return: TExp
    """
    def sub_exp_exp(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, TExp)
        return self.makeExp(self.sub_nat_nat(a.mantissa, b.mantissa))

    """  
        params: 
            a: TNat
            b: TNat
        return: TNat
    """
    def sub_nat_nat(self, a, b):
        sp.set_type(a, sp.TNat)
        sp.set_type(b, sp.TNat)
        return sp.as_nat(a - b, message = EC.SUBTRACTION_UNDERFLOW)

    """    
        params: 
            a: TExp
            b: TExp
        return: TExp
    """
    def mul_exp_exp(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, TExp)
        return self.makeExp(a.mantissa * b.mantissa // self.data.expScale)

    """    
        params: 
            a: TExp
            b: TNat
        return: TExp
    """
    def mul_exp_nat(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, sp.TNat)
        return self.makeExp(a.mantissa * b)

    """    
        params: 
            a: TNat
            b: TExp
        return: TNat
    """
    def mul_nat_exp(self, a, b):
        sp.set_type(a, sp.TNat)
        sp.set_type(b, TExp)
        return a * b.mantissa // self.data.expScale

    """    
        params: 
            a: TExp
            b: TExp
        return: TExp
    """
    def div_exp_exp(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, TExp)
        sp.verify(b.mantissa > 0, EC.DIVISION_BY_ZERO)
        return self.makeExp(a.mantissa * self.data.expScale // b.mantissa)

    """    
        params: 
            a: TExp
            b: TNat
        return: TExp
    """
    def div_exp_nat(self, a, b):
        sp.set_type(a, TExp)
        sp.set_type(b, sp.TNat)
        sp.verify(b > 0, EC.DIVISION_BY_ZERO)
        return self.makeExp(a.mantissa // b)

    """    
        params: 
            a: TNat
            b: TExp
        return: TNat
    """
    def div_nat_exp(self, a, b):
        sp.set_type(a, sp.TNat)
        sp.set_type(b, TExp)
        sp.verify(b.mantissa > 0, EC.DIVISION_BY_ZERO)
        return a * self.data.expScale // b.mantissa
