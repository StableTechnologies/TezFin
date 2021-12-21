import React, { useEffect, useState } from 'react';
import { supplyMarketModalAction, supplyTokenAction, withdrawTokenAction } from '../../reduxContent/marketModal/actions';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';

import ConfirmModal from '../ConfirmModal';
import MarketModal from '../MarketModal';
import { useStyles } from './style';

const SupplyModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const {
        open, close, tokenDetails, onClick, enableToken
    } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);
    const { supplyMarketModal } = useSelector((state) => state.marketModal);
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

    const supplyToken = () => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const mintPair = { underlying, amount };
        dispatch(supplyTokenAction(mintPair, protocolAddresses, publicKeyHash));
        close();
        setAmount('');
        setTokenText('supply');
        handleOpenConfirm();
    };

    const withdrawToken = () => {
        const underlying = tokenDetails.assetType.toLowerCase();
        const redeemPair = { underlying, amount };

        dispatch(withdrawTokenAction(redeemPair, protocolAddresses, publicKeyHash));
        close();
        setAmount('');
        setTokenText('withdraw');
        handleOpenConfirm();
    };

    useEffect(() => {
        dispatch(supplyMarketModalAction(account, markets[tokenDetails.assetType]));
    }, [dispatch, open]);

    useEffect(() => {
        setAmount('');
    }, [close]);

    const modalHeaderText = enableToken ? '' : `To supply and use ${tokenDetails.banner} as collateral, you will need to enable the token first.`;

    if (supplyMarketModal.borrowLimitUsd) {
      const scale = new BigNumber('1000000000000000000');
      tokenDetails.borrowLimit = new BigNumber(supplyMarketModal.borrowLimitUsd.toString()).dividedBy(scale).toFixed(2);
      tokenDetails.borrowLimitUsed = (supplyMarketModal.borrowLimitUsed / 10000).toFixed(2);
    }

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} />
            <MarketModal
                headerText={modalHeaderText}
                APYText={`${tokenDetails.title} Variable APY Rate`}
                Limit="Borrow Limit"
                LimitUsed="Borrow Limit Used"
                amountText="Wallet Balance"
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
