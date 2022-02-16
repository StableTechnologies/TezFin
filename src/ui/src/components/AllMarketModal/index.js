import React, { useEffect, useState } from 'react';
import { supplyTokenAction, borrowTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../StatusModal/ConfirmationModal';
import SuccessModal from '../StatusModal/SuccessModal';
import ErrorModal from '../StatusModal/ErrorModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { marketAction } from '../../reduxContent/market/actions';
import { undecimalify, verifyTransaction } from '../../util';

import { decimals } from 'tezoslendingplatformjs';
import { marketsMaxAction } from '../../util/maxAction';

const AllMarketModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { open, close, tokenDetails } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [openConfirmModal, setConfirmModal] = useState(false);
    const [openSuccessModal, setSuccessModal] = useState(false);
    const [openErrorModal, setErrorModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');
    const [confirm, setConfirm] = useState('');
    const [confirmError, setConfirmError] = useState('');
    const [error, setError] = useState('');

    const handleOpenConfirm = () => setConfirmModal(true);
    const handleCloseConfirm = () => setConfirmModal(false);
    const handleOpenSuccess = () => setSuccessModal(true);
    const handleCloseSuccess = () => setSuccessModal(false);
    const handleOpenError = () => setErrorModal(true);
    const handleCloseError = () => setErrorModal(false);

    const supplyToken = async() => {
      const { response, error} = await supplyTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
      setResponse(response);
      setError(error);
    };

    const borrowToken = async() => {
      const { response, error } = await borrowTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
      setResponse(response);
      setError(error);
    };

    useEffect(() => tokenText && handleOpenConfirm(), [tokenText]);
    useEffect(() => setAmount(undecimalify(maxAmount, decimals[tokenDetails.title])), [maxAmount]);

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
        setConfirmModal(false);
        setErrorModal(true);
      }
    }, [error]);

    useEffect(() => {
      if(confirm) {
        setConfirmModal(false);
        setSuccessModal(true);
        dispatch(marketAction(comptroller, protocolAddresses, server));
      }
    }, [confirm]);

    useEffect(() => {
      if(confirmError) {
        setConfirmModal(false);
        setErrorModal(true);
      }
    }, [confirmError]);

    useEffect(() => {
      setAmount('');
      setMaxAmount('');
    }, [close]);

    return (
      <>
        <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} approved={response} />
        <SuccessModal open={openSuccessModal} close={handleCloseSuccess} token={tokenDetails.title} tokenText={tokenText} amount={amount} />
        <ErrorModal open={openErrorModal} close={handleCloseError} token={tokenDetails.title} tokenText={tokenText} error={error} confirmError={confirmError} />
        <DashboardModal
          APYText={`${tokenDetails.title} Variable APY Rate`}
          APYTextTwo="Borrow APY"
          Limit="Borrow Limit"
          LimitUsed="Borrow Limit Used"
          CurrentStateText= "Currently Supplying"
          CurrentStateTextTwo= "Currently Borrowing"
          open={open}
          close={close}
          tokenDetails={tokenDetails}
          handleClickTabOne={supplyToken}
          handleClickTabTwo={borrowToken}
          labelOne="Supply"
          labelTwo="Borrow"
          buttonOne="Supply"
          buttonTwo="Borrow"
          btnSub={classes.btnSub}
          btnSubTwo={classes.btnSubTwo}
          inkBarStyle={classes.inkBarStyle}
          inkBarStyleTwo={classes.inkBarStyleTwo}
          setAmount={(e) => { setAmount(e); }}
          visibility={true}
          mainModal={true}
          inputBtnTextOne = "Use Max"
          inputBtnTextTwo = "80% Limit"
          maxAction={(tabValue) => marketsMaxAction(tabValue, tokenDetails, setMaxAmount)}
          maxAmount= {maxAmount}
        />
      </>
    );
};

export default AllMarketModal;
