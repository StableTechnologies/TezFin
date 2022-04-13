// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { decimals } from 'tezoslendingplatformjs';
import { useDispatch, useSelector } from 'react-redux';

import { marketAction } from '../../reduxContent/market/actions';

import { confirmTransaction, undecimalify, verifyTransaction } from '../../util';
import { borrowingMaxAction } from '../../util/maxAction';
import { borrowTokenAction, repayBorrowTokenAction } from '../../util/modalActions';
import { useBorrowErrorText, useRepayErrorText } from '../../util/customHooks';

import InitializeModal from '../StatusModal/InitializeModal';
import PendingModal from '../StatusModal/PendingModal';
import SuccessModal from '../StatusModal/SuccessModal';
import ErrorModal from '../StatusModal/ErrorModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';

const BorrowModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { open, close, tokenDetails } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const { borrowLimit } = useSelector((state) => state.borrowComposition.borrowComposition);
    const publicKeyHash = account.address;

    const [openInitializeModal, setInitializeModal] = useState(false);
    const [openPendingModal, setPendingModal] = useState(false);
    const [openSuccessModal, setSuccessModal] = useState(false);
    const [openErrorModal, setErrorModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');
    const [opGroup, setOpGroup] = useState('');
    const [confirm, setConfirm] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [error, setError] = useState('');
    const [evaluationError, setEvaluationError] = useState(false);
    const [errType, setErrType] = useState(false);
    const [tokenValue, setTokenValue] = useState('');
    const [currrentTab, setCurrrentTab] = useState('');
    const [limit, setLimit] = useState('');

    const buttonOne = useBorrowErrorText(tokenValue, limit);
    const buttonTwo = useRepayErrorText(tokenValue, limit);

    const handleOpenInitialize = () => setInitializeModal(true);
    const handleCloseInitialize = () => setInitializeModal(false);
    const handleClosePending = () => setPendingModal(false);
    const handleCloseSuccess = () => setSuccessModal(false);
    const handleCloseError = () => setErrorModal(false);

    const borrowToken = async () => {
        // eslint-disable-next-line no-shadow
        const { opGroup, error } = await borrowTokenAction(tokenDetails, amount, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash);
        setOpGroup(opGroup);
        setEvaluationError(error);
    };

    const repayBorrowToken = async () => {
        // eslint-disable-next-line no-shadow
        const { opGroup, error } = await repayBorrowTokenAction(tokenDetails, amount, close, setTokenText, handleOpenInitialize, protocolAddresses, publicKeyHash);
        setOpGroup(opGroup);
        setEvaluationError(error);
    };

    useEffect(() => tokenText && handleOpenInitialize(), [tokenText]);
    useEffect(() => setAmount(undecimalify(maxAmount, decimals[tokenDetails.title])), [maxAmount]);

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
        setMaxAmount('');
    }, [close]);

    useEffect(() => {
        borrowingMaxAction(currrentTab, tokenDetails, borrowLimit, setLimit);
        return () => {
            setLimit('');
        };
    }, [currrentTab, tokenDetails]);

    return (
        <>
            <InitializeModal open={openInitializeModal} close={handleCloseInitialize} />
            <PendingModal open={openPendingModal} close={handleClosePending} token={tokenDetails.title} tokenText={tokenText} response={response} />
            <SuccessModal open={openSuccessModal} close={handleCloseSuccess} token={tokenDetails.title} tokenText={tokenText} amount={amount} />
            <ErrorModal open={openErrorModal} close={handleCloseError} token={tokenDetails.title} tokenText={tokenText} error={error} errType={errType} />
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
                buttonOne={buttonOne}
                buttonTwo={buttonTwo}
                btnSub={classes.btnSub}
                inkBarStyle={classes.inkBarStyle}
                visibility={true}
                setAmount={(e) => { setAmount(e); }}
                inputBtnTextOne = "80% Limit"
                inputBtnTextTwo = "Use Max"
                maxAction={(tabValue) => borrowingMaxAction(tabValue, tokenDetails, borrowLimit, setMaxAmount)}
                maxAmount= {maxAmount}
                getProps={(tokenAmount, tabValue) => { setTokenValue(tokenAmount); setCurrrentTab(tabValue); }}
            />
        </>
    );
};

export default BorrowModal;
