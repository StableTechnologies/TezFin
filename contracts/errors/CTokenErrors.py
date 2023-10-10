class ErrorCodes:
    # Insufficient supply
    CT_INSUFFICIENT_SUPPLY = "CT_INSUFFICIENT_SUPPLY"
    # Insufficient balance
    CT_INSUFFICIENT_BALANCE = "FA1.2_InsufficientBalance"
    # Liquidator must be different from borrower
    CT_INVALID_LIQUIDATOR = "CT_INVALID_LIQUIDATOR"
    # Repay amount is zero
    CT_ZERO_REPAY = "CT_ZERO_REPAY"
    # Transfer is not approved
    CT_TRANSFER_NOT_APPROVED = "FA1.2_NotAllowed"
    # Couldn't approve the second time
    CT_UNSAFE_ALLOWANCE_CHANGE = "FA1.2_UnsafeAllowanceChange"
    # Max approvals reached 
    CT_MAX_APPROVALS = "FA1.2_MaxApprovalsReached"
    # Sender should be interest rate model
    CT_SENDER_NOT_IRM = "CT_SENDER_NOT_IRM"
    # Seize is allowed only to comptroller
    CT_SEIZE_SENDER = "CT_SEIZE_SENDER"
    # Repay amount is too high for liquidation
    CT_INVALID_REPAY = "CT_INVALID_REPAY"
    # New reserve factor is too high
    CT_INVALID_RESERVE_FACTOR = "CT_INVALID_RESERVE_FACTOR"
    # New borrow rate is too high
    CT_INVALID_BORROW_RATE = "CT_INVALID_BORROW_RATE"
    # Reduce amount is bigger than total reserve
    CT_REDUCE_AMOUNT = "CT_REDUCE_AMOUNT"
    # Protocol has insufficient cash
    CT_INSUFFICIENT_CASH = "CT_INSUFFICIENT_CASH"
    # Market's block number should be equal to current block number
    CT_BLOCK_LEVEL = "CT_BLOCK_LEVEL"
    # Mutez sweep is not allowed for CXTZ
    CT_SWEEP_XTZ = "CT_SWEEP_XTZ"
    # Sweep is not allowed for the underlying token
    CT_SWEEP_UNDERLYING = "CT_SWEEP_UNDERLYING"
    # Only underlying token can set cash
    CT_INVALID_CASH_SENDER = "CT_INVALID_CASH_SENDER"
    # Received cash data is invalid
    CT_INVALID_CASH_DATA = "CT_INVALID_CASH_DATA"
    # The amount of transferred mutez is invalid
    CT_INVALID_MUTEZ = "CT_INVALID_MUTEZ"
    # The function should not be used as an internal callback
    CT_INTERNAL_CALL = "CT_INTERNAL_CALL"
    # Internal function
    CT_INTERNAL_FUNCTION = "CT_INTERNAL_FUNCTION"
    # Sender must be administrator
    CT_NOT_ADMIN = "CT_NOT_ADMIN"
    # Sender must be pending admin
    CT_NOT_PENDING_ADMIN = "CT_NOT_PENDING_ADMIN"
    # Pending administrator hasn't been set
    CT_NOT_SET_PENDING_ADMIN = "CT_NOT_SET_PENDING_ADMIN"
    # Accrued interest is already invalid
    CT_INTEREST_INVALID = "CT_INTEREST_INVALID"
    # Accrued interest is too old
    CT_INTEREST_OLD = "CT_INTEREST_OLD"
    # comptroller rejected seize call
    CT_LIQUIDATE_SEIZE_COMPTROLLER_REJECTION = "CT_LIQUIDATE_SEIZE_COMPTROLLER_REJECTION"
    # liquidator and borrower addresses same in seize token call
    CT_LIQUIDATE_SEIZE_LIQUIDATOR_IS_BORROWER = "CT_LIQUIDATE_SEIZE_LIQUIDATOR_IS_BORROWER"
    # liquodate op rejected by comptroller
    CT_LIQUIDATE_COMPTROLLER_REJECTION = "CT_LIQUIDATE_COMPTROLLER_REJECTION"
    # liquidator and borrower addresses same in liquidate token call
    CT_LIQUIDATE_LIQUIDATOR_IS_BORROWER = "CT_LIQUIDATE_LIQUIDATOR_IS_BORROWER"
    # repay amount in liquidate call <= 0
    CT_LIQUIDATE_CLOSE_AMOUNT_IS_INVALID = "CT_LIQUIDATE_CLOSE_AMOUNT_IS_INVALID"
