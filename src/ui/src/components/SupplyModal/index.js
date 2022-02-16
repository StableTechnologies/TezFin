import React, { useEffect, useState } from 'react';
import { supplyTokenAction, withdrawTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../StatusModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { marketAction } from '../../reduxContent/market/actions';

import { undecimalify, verifyTransaction } from '../../util';
import { decimals } from 'tezoslendingplatformjs';
import { supplyingMaxAction } from '../../util/maxAction';

const SupplyModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();
    const { open, close, tokenDetails, onClick } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [openConfirmModal, setConfirmModal] = useState(false);
    const [amount, setAmount] = useState('');
    const [maxAmount, setMaxAmount] = useState('');
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleOpenConfirm = () => setConfirmModal(true);
    const handleCloseConfirm = () => setConfirmModal(false);

    const supplyToken = async() => {
        const { response, error } = await supplyTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
        setResponse(response);
        setError(error);
    };

    const withdrawToken = async() => {
      const {response, error} = await withdrawTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
      setResponse(response);
      setError(error);
    };

    useEffect(() => error &&  setTokenText('error'), [error]);
    useEffect(() => tokenText && handleOpenConfirm(), [tokenText]);
    useEffect(() => setAmount(undecimalify(maxAmount, decimals[tokenDetails.title])), [maxAmount]);

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

    useEffect(() => {
      setAmount('');
      setMaxAmount('');
    }, [close]);

    return (
      <>
        <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} error={error} />
        <DashboardModal
          APYText={`${tokenDetails.title} Variable APY Rate`}
          Limit="Borrow Limit"
          LimitUsed="Borrow Limit Used"
          CurrentStateText="Currently Supplying"
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
          setAmount={(e) => { setAmount(e); }}
          inputBtnTextOne = "Use Max"
          inputBtnTextTwo = "Use Max"
          maxAction={(tabValue) => supplyingMaxAction(tabValue, tokenDetails, setMaxAmount)}
          maxAmount= {maxAmount}
        />
      </>
    );
};

export default SupplyModal;
