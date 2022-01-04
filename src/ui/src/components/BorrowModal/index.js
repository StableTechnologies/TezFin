import React, { useEffect, useState } from 'react';
import { borrowTokenAction, repayBorrowTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../ConfirmModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';

const BorrowModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { open, close, tokenDetails } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);
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

    const borrowToken = async() => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const borrowPair = { underlying, amount };
        close();
        setAmount('');
        setTokenText('borrow');
        handleOpenConfirm();
        const response = await borrowTokenAction(borrowPair, protocolAddresses, publicKeyHash);
        if(response) {
          setConfirmModal(false);
        }
    };

    const repayBorrowToken = async() => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const repayBorrowPair = { underlying, amount };
        close();
        setAmount('');
        setTokenText('repay');
        handleOpenConfirm();
        const response = await repayBorrowTokenAction(repayBorrowPair, protocolAddresses, publicKeyHash);
        if(response) {
          setConfirmModal(false);
        }
    };

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} />
            <DashboardModal
                APYText="Borrow APY"
                Limit="Borrow Limit"
                LimitUsed="Borrow Limit Used"
                CurrentStateText="Currently Borrowing"
                open={open}
                close={close}
                tokenDetails={tokenDetails}
                handleClickTabOne={borrowToken}
                handleClickTabTwo={repayBorrowToken}
                labelOne="Borrow"
                labelTwo="Repay"
                buttonOne="Borrow"
                buttonTwo="Repay"
                btnSub={classes.btnSub}
                inkBarStyle={classes.inkBarStyle}
                visibility={true}
                amount={(e) => { setAmount(e); }}
                progressBarColor={classes.root}
            />
        </>
    );
};

export default BorrowModal;
