import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { borrowMarketModalAction, borrowTokenAction, repayBorrowTokenAction } from '../../reduxContent/marketModal/actions';
import ConfirmModal from '../ConfirmModal';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const BorrowModal = (props) => {
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

    const borrowToken = () => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const borrowPair = { underlying, amount };
        dispatch(borrowTokenAction(borrowPair, protocolAddresses, publicKeyHash));
        close();
        setAmount('');
        setTokenText('borrow');
        handleOpenConfirm();
    };

    const repayBorrowToken = () => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const repayBorrowPair = { underlying, amount };
        dispatch(repayBorrowTokenAction(repayBorrowPair, protocolAddresses, publicKeyHash));
        close();
        setAmount('');
        setTokenText('repay');
        handleOpenConfirm();
    };

    useEffect(() => {
        dispatch(borrowMarketModalAction(account, markets[tokenDetails.assetType]));
    }, [dispatch, open]);

    if (borrowMarketModal.borrowBalanceUsd) {
        tokenDetails.borrowBalanceUsd = borrowMarketModal.borrowBalanceUsd.toString();
        tokenDetails.borrowLimitUsed = borrowMarketModal.borrowLimitUsed / 10000;
    }

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText= {tokenText}/>
            <MarketModal
                APYText = "Borrow APY"
                Limit = "Borrow Balance"
                LimitUsed = "Borrow Limit Used"
                amountText = "Currently Borrowing"
                open = {open}
                close = {close}
                tokenDetails = {tokenDetails}
                handleClickTabOne = {borrowToken}
                handleClickTabTwo = {repayBorrowToken}
                labelOne = "Borrow"
                labelTwo = "Repay"
                buttonOne = "Borrow"
                buttonTwo = "Repay"
                btnSub = {classes.btnSub}
                inkBarStyle = {classes.inkBarStyle}
                visibility = {true}
                amount={(e) => { setAmount(e.target.value); }}
                progressBarColor = {classes.root}
            />
        </>
    );
};

export default BorrowModal;