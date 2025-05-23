import smartpy as sp

class Viewer(sp.Contract):
    def __init__(self, t):
        self.init(last = sp.none)
        self.init_type(sp.TRecord(last = sp.TOption(t)))

    @sp.entry_point
    def target(self, params):
        self.data.last = sp.some(params)

class ViewerNat(Viewer):
    def __init__(self):
        Viewer.__init__(self, sp.TNat)

    @sp.entry_point
    def targetNat(self, params):
        sp.set_type(params, sp.TNat)
        self.data.last = sp.some(params)

class ViewerNatPair(Viewer):
    def __init__(self):
        Viewer.__init__(self, sp.TPair(sp.TNat, sp.TNat))

    @sp.entry_point
    def targetNatPair(self, params):
        sp.set_type(params, sp.TPair(sp.TNat, sp.TNat))
        self.data.last = sp.some(params)

class ViewerInt(Viewer):
    def __init__(self):
        Viewer.__init__(self, sp.TInt)

    @sp.entry_point
    def targetInt(self, params):
        sp.set_type(params, sp.TInt)
        self.data.last = sp.some(params)
