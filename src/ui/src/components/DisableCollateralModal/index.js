import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { marketAction } from '../../reduxContent/market/actions';

import { disableCollateralizeTokenAction } from '../../util/modalActions';
import PendingModal from '../StatusModal/PendingModal';
import DashboardModal from '../DashboardModal';
import SuccessModal from '../StatusModal/SuccessModal';
import ErrorModal from '../StatusModal/ErrorModal';

import { useStyles } from './style';
import { verifyTransaction } from '../../util';

const DisableCollateralModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { open, close, tokenDetails, onClick } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [openPendingModal, setPendingModal] = useState(false);
    const [openSuccessModal, setSuccessModal] = useState(false);
    const [openErrorModal, setErrorModal] = useState(false);
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');
    const [confirm, setConfirm] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [error, setError] = useState('');

    const handleOpenPending = () => setPendingModal(true);
    const handleClosePending = () => setPendingModal(false);
    const handleOpenSuccess = () => setSuccessModal(true);
    const handleCloseSuccess = () => setSuccessModal(false);
    const handleOpenError = () => setErrorModal(true);
    const handleCloseError = () => setErrorModal(false);

    const disableToken = async() => {
        const { assetType } = tokenDetails;
        close();
        setTokenText('disable');
        handleOpenPending();
        const { response, error} = await disableCollateralizeTokenAction(assetType, protocolAddresses, publicKeyHash);
        setResponse(response);
        setError(error);
    };

    useEffect(() => tokenText && handleOpenPending(), [tokenText]);

    useEffect(() => {
      if(response) {
        (async () => {
          const { confirm, error } = await verifyTransaction(response);
          setConfirm(confirm);
          setConfirmError(error);
        })()
      }
    }, [response]);

    useEffect(() => {
      if(error) {
        setPendingModal(false);
        setErrorModal(true);
      }
    }, [error]);

    useEffect(() => {
      if(confirm) {
        setPendingModal(false);
        setSuccessModal(true);
        dispatch(marketAction(comptroller, protocolAddresses, server));
      }
    }, [confirm]);

    useEffect(() => {
      if(confirmError) {
        setPendingModal(false);
        setErrorModal(true);
      }
    }, [confirmError]);


    return (
      <>
        <PendingModal open={openPendingModal} close={handleClosePending} token={tokenDetails.title} tokenText={tokenText} response={response} />
        <SuccessModal open={openSuccessModal} close={handleCloseSuccess} token={tokenDetails.title} tokenText={tokenText} />
        <ErrorModal open={openErrorModal} close={handleCloseError} token={tokenDetails.title} tokenText={tokenText} error={error} confirmError={confirmError} />
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
