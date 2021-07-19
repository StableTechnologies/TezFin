import smartpy as sp

CFA12 = sp.io.import_script_from_url("file:contracts/CFA12.py")
CToken = sp.io.import_script_from_url("file:contracts/CToken.py")
CXTZ = sp.io.import_script_from_url("file:contracts/CXTZ.py")


sp.add_compilation_target("CFA12", CFA12.CFA12())

sp.add_compilation_target("CToken", CToken.CToken())

sp.add_compilation_target("CXTZ", CXTZ.CXTZ())

