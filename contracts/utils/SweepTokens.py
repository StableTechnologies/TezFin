import smartpy as sp

TransferTokens = sp.io.import_script_from_url("file:contracts/utils/TransferTokens.py")

class SweepTokens(TransferTokens.TransferTokens):
    """    
        A public function to sweep accidental MUTEZ transfers to this contract. MUTEZ are sent to admin

        dev: if administrator is contract, it should have 'receive' entry point that accepts TUnit

        isContract: TBool - indicates the type of admin - contract or account
    """
    @sp.entry_point
    def sweepMutez(self, isContract):
        sp.set_type(isContract, sp.TBool)
        self.verifySweepMutez()
        sp.if isContract:
            handle = sp.contract(sp.TUnit, self.data.administrator, entry_point="receive").open_some()
            sp.transfer(sp.unit, sp.balance, handle)
        sp.else:
            sp.send(self.data.administrator, sp.balance)
        
    def verifySweepMutez(self): # Override
        pass


    """    
        A public function to sweep accidental FA1.2 transfers to this contract. Tokens are sent to admin

        params: TUnit
    """
    @sp.entry_point
    def sweepFA12(self, params):
        sp.set_type(params, sp.TRecord(amount = sp.TNat, tokenAddress = sp.TAddress))
        self.verifySweepFA12(params.tokenAddress)
        self.transferFA12(sp.self_address, self.data.administrator, params.amount, params.tokenAddress)
        
    def verifySweepFA12(self, tokenAddress): # Override
        pass


    """    
        A public function to sweep accidental FA2 transfers to this contract. Tokens are sent to admin

        params: TUnit
    """
    @sp.entry_point
    def sweepFA2(self, params):
        sp.set_type(params, sp.TRecord(amount = sp.TNat, tokenAddress = sp.TAddress, id = sp.TNat))
        self.verifySweepFA2(params.tokenAddress, params.id)
        self.transferFA2(sp.self_address, self.data.administrator, params.amount, params.tokenAddress, params.id)
        
    def verifySweepFA2(self, tokenAddress, id): # Override
        pass
