import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { disableCollateralizeTokenAction } from '../../util/modalActions';
import ConfirmModal from '../ConfirmModal';

import DashboardModal from '../DashboardModal';

import { useStyles } from './style';

const DisableCollateralModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const {
        open, close, tokenDetails, onClick
    } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { markets } = useSelector((state) => state.market);
    const { protocolAddresses } = useSelector((state) => state.nodes);
    const publicKeyHash = account.address;

    const [openConfirmModal, setConfirmModal] = useState(false);
    const [tokenText, setTokenText] = useState('');

    const handleOpenConfirm = () => {
        setConfirmModal(true);
    };
    const handleCloseConfirm = () => {
        setConfirmModal(false);
    };

    const disableToken = async() => {
        const { assetType } = tokenDetails;
        close();
        setTokenText('disable');
        handleOpenConfirm();
        const response = await disableCollateralizeTokenAction(assetType, protocolAddresses, publicKeyHash);
        if(response) {
          setConfirmModal(false);
        }
    };

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText= {tokenText}/>
            <DashboardModal
                headerText = "This asset will no longer be used towards your borrowing limit, and can’t be seized in liquidation."
                APYText = {`${tokenDetails.title} ` + 'Variable APY Rate'}
                Limit = "Borrow Limit"
                LimitUsed = "Borrow Limit Used"
                amountText = "Wallet Balance"
                open = {open}
                close = {close}
                tokenDetails = {tokenDetails}
                onClick = {onClick}
                handleClickTabOne = {disableToken}
                buttonOne = "Disable Token"
                btnSub = {classes.btnSub}
                extraPadding = {classes.collateralizePadding}
                collateralize
                visibility
            />

        </>
    );
};

export default DisableCollateralModal;
