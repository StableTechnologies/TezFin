import smartpy as sp

class Viewer(sp.Contract):
    def __init__(self, t):
        self.init(last = sp.none)
        self.init_type(sp.TRecord(last = sp.TOption(t)))

    @sp.entry_point
    def target(self, params):
        self.data.last = sp.some(params)
        
    @sp.entry_point
    def targetNat(self, params):
        sp.set_type(params, sp.TNat)
        self.data.last = sp.some(params)
