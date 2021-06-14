import smartpy as sp

class FA12Mock(sp.Contract):
    def __init__(self):
        self.init(balances=sp.big_map(tvalue=sp.TRecord(approvals=sp.TMap(sp.TAddress, sp.TNat), balance=sp.TNat)))

    @sp.entry_point
    def transfer(self, params):
        sp.set_type(params, sp.TRecord(from_=sp.TAddress, to_=sp.TAddress,
                                       value=sp.TNat).layout(("from_ as from", ("to_ as to", "value"))))
        sp.verify((params.from_ == sp.sender) |
                      (self.data.balances[params.from_].approvals[sp.sender] >= params.value))
        self.addAddressIfNecessary(params.to_)
        sp.verify(self.data.balances[params.from_].balance >= params.value)
        self.data.balances[params.from_].balance = sp.as_nat(
            self.data.balances[params.from_].balance - params.value)
        self.data.balances[params.to_].balance += params.value
        sp.if params.from_ != sp.sender:
            self.data.balances[params.from_].approvals[sp.sender] = sp.as_nat(
                self.data.balances[params.from_].approvals[sp.sender] - params.value)

    @sp.entry_point
    def approve(self, params):
        sp.set_type(params, sp.TRecord(spender=sp.TAddress,
                                       value=sp.TNat).layout(("spender", "value")))
        self.data.balances[sp.sender].approvals[params.spender] = params.value

    def addAddressIfNecessary(self, address):
        sp.if ~ self.data.balances.contains(address):
            self.data.balances[address] = sp.record(balance=0, approvals={})

    @sp.entry_point
    def mint(self, params):
        sp.set_type(params, sp.TRecord(address = sp.TAddress, value = sp.TNat))
        self.addAddressIfNecessary(params.address)
        self.data.balances[params.address].balance += params.value

    @sp.utils.view(sp.TNat)
    def getBalance(self, params):
        sp.result(self.data.balances[params].balance)
