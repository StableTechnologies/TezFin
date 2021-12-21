import React, { useEffect, useState } from 'react';
import { borrowMarketModalAction, borrowTokenAction, repayBorrowTokenAction } from '../../reduxContent/marketModal/actions';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';

import ConfirmModal from '../ConfirmModal';
import MarketModal from '../MarketModal';
import { useStyles } from './style';

const AllMarketModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { open, close, tokenDetails } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);
    const { borrowMarketModal } = useSelector((state) => state.marketModal);
    const publicKeyHash = account.address;

    const [amount, setAmount] = useState('');
    const [openConfirmModal, setConfirmModal] = useState(false);
    const [tokenText, setTokenText] = useState('');

    const handleOpenConfirm = () => {
        setConfirmModal(true);
    };
    const handleCloseConfirm = () => {
        setConfirmModal(false);
    };


    useEffect(() => {
        dispatch(borrowMarketModalAction(account, markets[tokenDetails.assetType]));
    }, [dispatch, open]);

    if (borrowMarketModal.borrowBalanceUsd) {
        const scale = new BigNumber('1000000000000000000');
        tokenDetails.borrowBalanceUsd = new BigNumber(borrowMarketModal.borrowBalanceUsd.toString()).dividedBy(scale).toFixed(2);
        tokenDetails.borrowLimitUsed = (borrowMarketModal.borrowLimitUsed / 10000).toFixed(2);
    }

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} />
            <MarketModal
                APYText="Borrow APY"
                Limit="Borrow Balance"
                LimitUsed="Borrow Limit Used"
                amountText="Currently Borrowing"
                open={open}
                close={close}
                tokenDetails={tokenDetails}
                // handleClickTabOne={borrowToken}
                // handleClickTabTwo={repayBorrowToken}
                labelOne="Supply"
                labelTwo="Borrow"
                buttonOne="Supply"
                buttonTwo="Borrow"
                btnSub={classes.btnSub}
                inkBarStyle={classes.inkBarStyle}
                visibility={true}
                amount={(e) => { setAmount(e); }}
                progressBarColor={classes.root}
            />
        </>
    );
};

export default AllMarketModal;
