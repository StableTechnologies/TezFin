class ErrorCodes:
    # Already joined to the market
    CMPT_MARKET_JOINED = "CMPT_MARKET_JOINED"
    # The sender has a borrow balance
    CMPT_BORROW_IN_MARKET = "CMPT_BORROW_IN_MARKET"
    # Mint is paused
    CMPT_MINT_PAUSED = "CMPT_MINT_PAUSED"
    # Borrow is paused
    CMPT_BORROW_PAUSED = "CMPT_BORROW_PAUSED"
    # Transfer is paused
    CMPT_TRANSFER_PAUSED = "CMPT_TRANSFER_PAUSED"
    # Seize is paused
    CMPT_SEIZE_PAUSED = "CMPT_SEIZE_PAUSED"
    # The redeemer shouldn't have shortfall
    CMPT_REDEEMER_SHORTFALL = "CMPT_REDEEMER_SHORTFALL"
    # Sender must be cToken
    CMPT_INVALID_BORROW_SENDER = "CMPT_INVALID_BORROW_SENDER"
    # CToken's price is invalid
    CMPT_INVALID_PRICE = "CMPT_INVALID_PRICE"
    # The borrower must have a shortfall in order to be liquidatable
    CMPT_NO_SHORTFALL = "CMPT_NO_SHORTFALL"
    # Seize should be initiated by CToken
    CMPT_INVALID_SEIZE_SENDER = "CMPT_INVALID_SEIZE_SENDER"
    # Asset price was not updated
    CMPT_UPDATE_PRICE = "CMPT_UPDATE_PRICE"
    # Market not exists
    CMPT_MARKET_NOT_EXISTS = "CMPT_MARKET_NOT_EXISTS"
    # Market not listed
    CMPT_MARKET_NOT_LISTED = "CMPT_MARKET_NOT_LISTED"
    # Market already listed
    CMPT_MARKET_ALREADY_LISTED = "CMPT_MARKET_ALREADY_LISTED"
    # Internal function
    CMPT_INTERNAL_FUNCTION = "CMPT_INTERNAL_FUNCTION"
    # Sender must be administrator
    CMPT_NOT_ADMIN = "CMPT_NOT_ADMIN"
    # Sender must be pending admin
    CMPT_NOT_PENDING_ADMIN = "CMPT_NOT_PENDING_ADMIN"
    # Pending administrator hasn't been set
    CMPT_NOT_SET_PENDING_ADMIN = "CMPT_NOT_SET_PENDING_ADMIN"
    # Liquidity for the given account is not found
    CMPT_LIQUIDITY_ABSENT = "CMPT_LIQUIDITY_ABSENT"
    # Liquidity is already invalid
    CMPT_LIQUIDITY_INVALID = "CMPT_LIQUIDITY_INVALID"
    # Liquidity is too old
    CMPT_LIQUIDITY_OLD = "CMPT_LIQUIDITY_OLD"
    # invalid price from oracle
    CMPT_PRICE_ERROR = "CMPT_PRICE_ERROR"
    # insufficient shortfall to liquidate a users position
    CMPT_INSUFFICIENT_SHORTFALL = "CMPT_INSUFFICIENT_SHORTFALL"
    # liquidation repay amount larger than possible liquidation
    CMPT_TOO_MUCH_REPAY = "CMPT_TOO_MUCH_REPAY"
    # comptroller addresses for collateral token and borrowed token do not match
    CMPT_COMPTROLLER_MISMATCH = "CMPT_COMPTROLLER_MISMATCH"
    CMPT_OUTDATED_ACCOUNT_SNAPSHOT = "CMPT_OUTDATED_ACCOUNT_SNAPSHOT"
    CMPT_TOO_MANY_ASSETS = "CMPT_TOO_MANY_ASSETS"
