import smartpy as sp

class TransferTokens(sp.Contract):
    def transferFA12(self, sender, reciever, amount, tokenAddress): 
        TransferParam = sp.record(
            from_ = sender, 
            to_ = reciever, 
            value = amount
        )

        transferHandle = sp.contract(
                sp.TRecord(from_ = sp.TAddress, to_ = sp.TAddress, value = sp.TNat).layout(("from_ as from", ("to_ as to", "value"))),
                tokenAddress,
                "transfer"
            ).open_some()

        sp.transfer(TransferParam, sp.mutez(0), transferHandle)


    def transferFA2(self, sender, reciever, amount, tokenAddress, id):
        tx_type = sp.TRecord(to_ = sp.TAddress, token_id = sp.TNat, amount = sp.TNat)

        arg = [
            sp.record(
                from_ = sender,
                txs = [
                    sp.record(
                        to_ = reciever,
                        token_id = id, 
                        amount = amount 
                    )
                ]
            )
        ]

        transferHandle = sp.contract(
                sp.TList(sp.TRecord(from_ = sp.TAddress, txs = sp.TList(tx_type)).layout(("from_", "txs"))),
                tokenAddress,
                "transfer"
            ).open_some()

        sp.transfer(arg, sp.mutez(0), transferHandle)
