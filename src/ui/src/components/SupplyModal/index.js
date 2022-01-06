import React, { useEffect, useState } from 'react';
import { supplyTokenAction, withdrawTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../ConfirmModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { marketAction } from '../../reduxContent/market/actions';

const SupplyModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const {
        open, close, tokenDetails, onClick, enableToken
    } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [openConfirmModal, setConfirmModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [tokenText, setTokenText] = useState('');

    const handleOpenConfirm = () => {
        setConfirmModal(true);
    };
    const handleCloseConfirm = () => {
        setConfirmModal(false);
    };

    const supplyToken = async() => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const mintPair = { underlying, amount };
        close();
        setAmount('');
        setTokenText('supply');
        handleOpenConfirm();
        const response = await supplyTokenAction(mintPair, protocolAddresses, publicKeyHash);
        if(response) {
          dispatch(marketAction(comptroller, protocolAddresses, server));
          setConfirmModal(false);
        }
    };

    const withdrawToken = async() => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const redeemPair = { underlying, amount };
        close();
        setAmount('');
        setTokenText('withdraw');
        handleOpenConfirm();
        const response = await withdrawTokenAction(redeemPair, protocolAddresses, publicKeyHash);
        if(response) {
          dispatch(marketAction(comptroller, protocolAddresses, server));
          setConfirmModal(false);
        }
    };

    useEffect(() => {
        setAmount('');
    }, [close]);

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} />
            <DashboardModal
                APYText={`${tokenDetails.title} Variable APY Rate`}
                Limit="Borrow Limit"
                LimitUsed="Borrow Limit Used"
                CurrentStateText="Currently Supplying"
                open={open}
                close={close}
                tokenDetails={tokenDetails}
                onClick={onClick}
                handleClickTabOne={supplyToken}
                handleClickTabTwo={withdrawToken}
                labelOne="Supply"
                labelTwo="Withdraw"
                buttonOne="Supply"
                buttonTwo="Withdraw"
                btnSub={classes.btnSub}
                inkBarStyle={classes.inkBarStyle}
                visibility={true}
                amount={(e) => { setAmount(e); }}
            />
        </>
    );
};

export default SupplyModal;
