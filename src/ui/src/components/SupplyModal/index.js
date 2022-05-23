// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { decimals } from 'tezoslendingplatformjs';

import { marketAction } from '../../reduxContent/market/actions';

import { confirmTransaction, undecimalify, verifyTransaction } from '../../util';
import { supplyingMaxAction } from '../../util/maxAction';
import { supplyTokenAction, withdrawTokenAction } from '../../util/modalActions';
import { useSupplyErrorText, useWithdrawErrorText } from '../../util/modalHooks';

import InitializeModal from '../StatusModal/InitializeModal';
import PendingModal from '../StatusModal/PendingModal';
import SuccessModal from '../StatusModal/SuccessModal';
import ErrorModal from '../StatusModal/ErrorModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';

const SupplyModal = (props) => {
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
    const [amount, setAmount] = useState('');
    const [useMaxAmount, setUseMaxAmount] = useState('');
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');
    const [opGroup, setOpGroup] = useState('');
    const [confirm, setConfirm] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [error, setError] = useState(false);
    const [evaluationError, setEvaluationError] = useState(false);
    const [errType, setErrType] = useState(false);
    const [tokenValue, setTokenValue] = useState('');
    const [currentTab, setCurrentTab] = useState('');
    const [limit, setLimit] = useState('');

    const buttonOne = useSupplyErrorText(tokenValue, limit);
    const buttonTwo = useWithdrawErrorText(tokenValue, limit, tokenDetails);

    const handleOpenInitialize = () => setInitializeModal(true);
    const handleCloseInitialize = () => setInitializeModal(false);
    const handleClosePending = () => setPendingModal(false);
    const handleCloseSuccess = () => setSuccessModal(false);
    const handleCloseError = () => setErrorModal(false);

    const supplyToken = async () => {
        // eslint-disable-next-line no-shadow
        const { opGroup, error } = await supplyTokenAction(tokenDetails, amount, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash);
        setOpGroup(opGroup);
        setEvaluationError(error);
    };

    const withdrawToken = async () => {
        // eslint-disable-next-line no-shadow
        const { opGroup, error } = await withdrawTokenAction(tokenDetails, amount, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash);
        setOpGroup(opGroup);
        setEvaluationError(error);
    };

    useEffect(() => tokenText && handleOpenInitialize(), [tokenText]);
    useEffect(() => setAmount(undecimalify(useMaxAmount, decimals[tokenDetails.title])), [useMaxAmount]);

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

    useEffect(() => {
        setAmount('');
        setUseMaxAmount('');
    }, [close]);

    useEffect(() => {
        supplyingMaxAction(currentTab, tokenDetails, setLimit);
        setUseMaxAmount(limit);

        return () => {
            setLimit('');
        };
    }, [currentTab, tokenDetails, tokenValue, limit]);

    return (
        <>
            <InitializeModal open={openInitializeModal} close={handleCloseInitialize} />
            <PendingModal open={openPendingModal} close={handleClosePending} token={tokenDetails.title} tokenText={tokenText} response={response} />
            <SuccessModal open={openSuccessModal} close={handleCloseSuccess} token={tokenDetails.title} tokenText={tokenText} amount={amount} />
            <ErrorModal open={openErrorModal} close={handleCloseError} token={tokenDetails.title} tokenText={tokenText} error={error} errType={errType} />
            <DashboardModal
                APYText={`${tokenDetails.title} Variable APY Rate`}
                CurrentStateText="Currently Supplying"
                open={open}
                close={close}
                tokenDetails={tokenDetails}
                onClick={onClick}
                handleClickTabOne={supplyToken}
                handleClickTabTwo={withdrawToken}
                labelOne="Supply"
                labelTwo="Withdraw"
                buttonOne={buttonOne.text}
                buttonTwo={buttonTwo.text}
                btnSub={classes.btnSub}
                inkBarStyle={classes.inkBarStyle}
                visibility={true}
                setAmount={(e) => { setAmount(e); }}
                inputBtnTextOne = "Use Max"
                inputBtnTextTwo = "Use Max"
                useMaxAmount= {useMaxAmount}
                errorText={(currentTab === 'one') ? buttonOne.errorText : buttonTwo.errorText}
                disabled={(currentTab === 'one') ? buttonOne.disabled : buttonTwo.disabled}
                getProps={(tokenAmount, tabValue) => { setTokenValue(tokenAmount); setCurrentTab(tabValue); }}
            />
        </>
    );
};

export default SupplyModal;
