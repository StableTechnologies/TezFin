// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import { useDispatch, useSelector } from 'react-redux';

import { marketAction } from '../../reduxContent/market/actions';

import { confirmTransaction, undecimalify, verifyTransaction } from '../../util';
import { borrowingMaxAction } from '../../util/maxAction';
import { borrowTokenAction, repayBorrowTokenAction } from '../../util/modalActions';
import { useBorrowErrorText, useRepayErrorText } from '../../util/modalHooks';

import InitializeModal from '../StatusModal/InitializeModal';
import PendingModal from '../StatusModal/PendingModal';
import SuccessModal from '../StatusModal/SuccessModal';
import ErrorModal from '../StatusModal/ErrorModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';

const BorrowModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { open, close, tokenDetails, tab } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const { borrowing, borrowLimit } = useSelector((state) => state.borrowComposition.borrowComposition);
    const { totalCollateral } = useSelector((state) => state.supplyComposition.supplyComposition);

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
    const [error, setError] = useState('');
    const [evaluationError, setEvaluationError] = useState(false);
    const [errType, setErrType] = useState(false);
    const [tokenValue, setTokenValue] = useState('');
    const [currentTab, setCurrentTab] = useState('');
    const [pendingLimit, setPendingLimit] = useState('');
    const [pendingLimitUsed, setPendingLimitUsed] = useState('');

    const buttonOne = useBorrowErrorText(tokenValue, borrowLimit, tokenDetails);
    const buttonTwo = useRepayErrorText(tokenValue, useMaxAmount, tokenDetails);

    const handleOpenInitialize = () => setInitializeModal(true);
    const handleCloseInitialize = () => setInitializeModal(false);
    const handleClosePending = () => setPendingModal(false);
    const handleCloseSuccess = () => setSuccessModal(false);
    const handleCloseError = () => setErrorModal(false);

    const borrowToken = async () => {
        // eslint-disable-next-line no-shadow
        const { opGroup, error } = await borrowTokenAction(
            tokenDetails,
            amount,
            close,
            setTokenText,
            handleOpenInitialize,
            protocolAddresses,
            publicKeyHash,
        );
        setOpGroup(opGroup);
        setEvaluationError(error);
    };

    console.log('acc', account.underlyingBalances[tokenDetails.assetType].value.toString());
    const repayBorrowToken = async () => {
        // eslint-disable-next-line no-shadow
        const { opGroup, error } = await repayBorrowTokenAction(
            tokenDetails,
            amount,
            close,
            setTokenText,
            handleOpenInitialize,
            protocolAddresses,
            publicKeyHash,
        );
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
        borrowingMaxAction(currentTab, tokenDetails, borrowLimit, setUseMaxAmount);
    }, [currentTab, tokenDetails, tokenValue, useMaxAmount]);

    useEffect(() => {
        const tokenValueUsd = new BigNumber(tokenValue).multipliedBy(new BigNumber(tokenDetails.usdPrice)).toNumber();
        let pendingBorrowing = 0;
        if (tokenValue > 0) {
            if (currentTab === 'one') {
                pendingBorrowing = borrowing + tokenValueUsd;
            }
            if (currentTab === 'two') {
                pendingBorrowing = borrowing - tokenValueUsd;
            }
            const pendingBorrowLimit = totalCollateral - pendingBorrowing;
            setPendingLimit(pendingBorrowLimit);
            setPendingLimitUsed(
                new BigNumber(pendingBorrowing).dividedBy(new BigNumber(totalCollateral)).multipliedBy(100),
            );
        }

        return () => {
            setPendingLimit('');
            setPendingLimitUsed('');
        };
    }, [tokenValue, currentTab]);

    return (
        <>
            <InitializeModal open={openInitializeModal} close={handleCloseInitialize} />
            <PendingModal
                open={openPendingModal}
                close={handleClosePending}
                token={tokenDetails.title}
                tokenText={tokenText}
                response={response}
            />
            <SuccessModal
                open={openSuccessModal}
                close={handleCloseSuccess}
                token={tokenDetails.title}
                tokenText={tokenText}
                amount={amount}
            />
            <ErrorModal
                open={openErrorModal}
                close={handleCloseError}
                token={tokenDetails.title}
                tokenText={tokenText}
                error={error}
                errType={errType}
            />
            <DashboardModal
                APYText="Borrow APY"
                CurrentStateText="Currently Borrowing"
                open={open}
                close={close}
                tokenDetails={tokenDetails}
                handleClickTabOne={borrowToken}
                handleClickTabTwo={repayBorrowToken}
                labelOne="Borrow"
                labelTwo="Repay"
                buttonOne={buttonOne.text}
                buttonTwo={buttonTwo.text}
                btnSub={classes.btnSub}
                inkBarStyle={classes.inkBarStyle}
                visibility={true}
                setAmount={(e) => {
                    setAmount(e);
                }}
                inputBtnTextOne={`${new BigNumber(tokenDetails.collateralFactor).multipliedBy(100)}% Limit`}
                inputBtnTextTwo="Use Max"
                useMaxAmount={useMaxAmount}
                errorText={currentTab === 'one' ? buttonOne.errorText : buttonTwo.errorText}
                disabled={currentTab === 'one' ? true : buttonTwo.disabled}
                pendingLimit={pendingLimit}
                pendingLimitUsed={pendingLimitUsed}
                getProps={(tokenAmount, tabValue) => {
                    setTokenValue(tokenAmount);
                    setCurrentTab(tabValue);
                }}
                tab={tab}
            />
        </>
    );
};

export default BorrowModal;
