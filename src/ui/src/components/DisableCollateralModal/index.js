// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { marketAction } from '../../reduxContent/market/actions';

import { disableCollateralizeTokenAction } from '../../util/modalActions';
import { useDisableTokenErrorText } from '../../util/modalHooks';

import InitializeModal from '../StatusModal/InitializeModal';
import PendingModal from '../StatusModal/PendingModal';
import DashboardModal from '../DashboardModal';
import SuccessModal from '../StatusModal/SuccessModal';
import ErrorModal from '../StatusModal/ErrorModal';

import { useStyles } from './style';
import { confirmTransaction, verifyTransaction } from '../../util';

const DisableCollateralModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const {
        open, close, tokenDetails, onClick
    } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [openInitializeModal, setInitializeModal] = useState(false);
    const [openPendingModal, setPendingModal] = useState(false);
    const [openSuccessModal, setSuccessModal] = useState(false);
    const [openErrorModal, setErrorModal] = useState(false);
    const [tokenText, setTokenText] = useState('');
    const [opGroup, setOpGroup] = useState('');
    const [response, setResponse] = useState('');
    const [confirm, setConfirm] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [error, setError] = useState('');
    const [evaluationError, setEvaluationError] = useState(false);
    const [errType, setErrType] = useState(false);

    const buttonOne = useDisableTokenErrorText(tokenDetails);

    const handleOpenInitialize = () => setInitializeModal(true);
    const handleCloseInitialize = () => setInitializeModal(false);
    const handleClosePending = () => setPendingModal(false);
    const handleCloseSuccess = () => setSuccessModal(false);
    const handleCloseError = () => setErrorModal(false);

    const disableToken = async () => {
        const { assetType } = tokenDetails;
        close();
        setTokenText('disable');
        handleOpenInitialize();
        // eslint-disable-next-line no-shadow
        const { opGroup, error } = await disableCollateralizeTokenAction(assetType, protocolAddresses, publicKeyHash);
        setOpGroup(opGroup);
        setEvaluationError(error);
    };

    useEffect(() => tokenText && handleOpenInitialize(), [tokenText]);

    useEffect(() => {
        if (opGroup) {
            setInitializeModal(false);
            setPendingModal(true);
            (async () => {
                // eslint-disable-next-line no-shadow
                const { response, error } = await confirmTransaction(opGroup);
                setResponse(response);
                setError(error);
            })();
        }
    }, [opGroup]);

    useEffect(() => {
        if (response) {
            (async () => {
                // eslint-disable-next-line no-shadow
                const { confirm, error } = await verifyTransaction(response);
                setConfirm(confirm);
                setConfirmError(error);
            })();
        }
    }, [response]);

    useEffect(() => {
        if (error) {
            setErrType('error');
            setPendingModal(false);
            setErrorModal(true);
        }
    }, [error]);

    useEffect(() => {
        if (evaluationError) {
            setErrType('evaluationError');
            setInitializeModal(false);
            setErrorModal(true);
        }
    }, [evaluationError]);

    useEffect(() => {
        if (confirm) {
            setPendingModal(false);
            setSuccessModal(true);
            dispatch(marketAction(comptroller, protocolAddresses, server));
        }
        return () => {
            setResponse('');
        };
    }, [confirm]);

    useEffect(() => {
        if (confirmError) {
            setErrType('confirmError');
            setPendingModal(false);
            setErrorModal(true);
        }
    }, [confirmError]);

    return (
        <>
            <InitializeModal open={openInitializeModal} close={handleCloseInitialize} />
            <PendingModal open={openPendingModal} close={handleClosePending} token={tokenDetails.title} tokenText={tokenText} response={response} />
            <SuccessModal open={openSuccessModal} close={handleCloseSuccess} token={tokenDetails.title} tokenText={tokenText} />
            <ErrorModal open={openErrorModal} close={handleCloseError} token={tokenDetails.title} tokenText={tokenText} error={error} errType={errType} />
            <DashboardModal
                headerText = "This asset will no longer be used towards your borrowing limit, and can’t be seized in liquidation."
                CurrentStateText= "Currently Supplying"
                amountText = "Wallet Balance"
                open = {open}
                close = {close}
                tokenDetails = {tokenDetails}
                onClick = {onClick}
                handleClickTabOne = {disableToken}
                buttonOne={buttonOne.text}
                errorText={buttonOne.errorText}
                disabled={buttonOne.disabled}
                btnSub = {classes.btnSub}
                extraPadding = {classes.collateralizePadding}
                collateralize
                visibility
            />
        </>
    );
};

export default DisableCollateralModal;
