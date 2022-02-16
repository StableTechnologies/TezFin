import React, { useEffect, useState } from 'react';
import { collateralizeTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../StatusModal/ConfirmationModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { marketAction } from '../../reduxContent/market/actions';
import { verifyTransaction } from '../../util';

const CollateralizeModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const {
        open, close, tokenDetails, onClick
    } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [openConfirmModal, setConfirmModal] = useState(false);
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleOpenConfirm = () => {
        setConfirmModal(true);
    };
    const handleCloseConfirm = () => {
        setConfirmModal(false);
    };

    const collateralizeToken = async() => {
        const { assetType } = tokenDetails;
        close();
        setTokenText('collateral');
        handleOpenConfirm();
        const { response, error } = await collateralizeTokenAction(assetType, protocolAddresses, publicKeyHash);
        setResponse(response);
        setError(error);
        console.log('response', response);
        console.log('error', error);
    };

    useEffect(() => error &&  setTokenText('error'), [error]);
    useEffect(() => {
      if(response) {
        setTokenText('verifying');
        (async () => {
          const confirm = await verifyTransaction(response);
          setConfirm(confirm);
          console.log('confirm', confirm);
        })()
      }
    }, [response]);

    useEffect(() => {
      if(confirm) {
        setTokenText('success');
        dispatch(marketAction(comptroller, protocolAddresses, server));
      }
    }, [confirm]);

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} error={error} />
            <DashboardModal
                headerText="Collateralizing an asset increases your borrowing limit. Please use caution as this can also subject your assets to being seized in liquidation."
                APYText={`${tokenDetails.title} ` + 'Variable APY Rate'}
                Limit="Borrow Limit"
                LimitUsed="Borrow Limit Used"
                amountText="Wallet Balance"
                open={open}
                close={close}
                tokenDetails={tokenDetails}
                handleClickTabOne={collateralizeToken}
                buttonOne="Use as Collateral"
                btnSub={classes.btnSub}
                extraPadding={classes.collateralizePadding}
                collateralize
                visibility
            />
        </>
    );
};

export default CollateralizeModal;
