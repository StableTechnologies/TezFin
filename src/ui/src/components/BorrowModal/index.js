import React, { useEffect, useState } from 'react';
import { decimals } from 'tezoslendingplatformjs';

import { borrowTokenAction, repayBorrowTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import PendingModal from '../StatusModal/PendingModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { marketAction } from '../../reduxContent/market/actions';
import { undecimalify, verifyTransaction } from '../../util';
import { borrowingMaxAction } from '../../util/maxAction';

const BorrowModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { open, close, tokenDetails } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [amount, setAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [openPendingModal, setPendingModal] = useState(false);
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleOpenPending = () => {
        setPendingModal(true);
    };
    const handleClosePending = () => {
        setPendingModal(false);
    };

    const borrowToken = async() => {
      const { response, error } = await borrowTokenAction(tokenDetails, amount, close, setTokenText, handleOpenPending, protocolAddresses, publicKeyHash);
      setResponse(response);
      setError(error);
    };

    const repayBorrowToken = async() => {
      const { response, error } = await repayBorrowTokenAction(tokenDetails, amount, close, setTokenText, handleOpenPending, protocolAddresses, publicKeyHash);
      setResponse(response);
      setError(error);
    };

    useEffect(() => error &&  setTokenText('error'), [error]);
    useEffect(() => tokenText && handleOpenPending(), [tokenText]);
    useEffect(() => setAmount(undecimalify(maxAmount, decimals[tokenDetails.title])), [maxAmount]);

    useEffect(() => {
      if(response) {
        setTokenText('verifying');
        (async () => {
          const confirm = await verifyTransaction(response);
          setConfirm(confirm);
        })()
      }
    }, [response]);

    useEffect(() => {
      if(confirm) {
        setTokenText('success');
        dispatch(marketAction(comptroller, protocolAddresses, server));
      }
    }, [confirm]);

    useEffect(() => {
      setAmount('');
      setMaxAmount('');
    }, [close]);

    return (
        <>
            <PendingModal open={openPendingModal} close={handleClosePending} token={tokenDetails.title} tokenText={tokenText} error={error} />
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
                setAmount={(e) => { setAmount(e); }}
                inputBtnTextOne = "80% Limit"
                inputBtnTextTwo = "Use Max"
                maxAction={(tabValue) => borrowingMaxAction(tabValue, tokenDetails, setMaxAmount)}
                maxAmount= {maxAmount}
            />
        </>
    );
};

export default BorrowModal;
