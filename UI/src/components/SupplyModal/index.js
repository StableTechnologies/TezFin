import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';
import { supplyMarketModalAction, supplyTokenAction, withdrawTokenAction } from '../../reduxContent/marketModal/actions';

import { useStyles } from './style';
import ConfirmModal from '../ConfirmModal';

const SupplyModal = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { open, close, tokenDetails, onClick, supply, enableToken, mint, withdraw } = props;

  const { account } = useSelector(state => state.addWallet);
  const { server } = useSelector(state => state.nodes.tezosNode);
  const { protocolAddresses, comptroller } = useSelector(state => state.nodes);
  const { markets } = useSelector(state => state.market);
  const { supplyMarketModal } = useSelector(state => state.marketModal);
  const publicKeyHash = account.address;

  const [openConfirmModal, setConfirmModal] =useState(false);
  const [amount, setAmount] = useState('');
  const [tokenText, setTokenText] = useState('');

  const handleOpenConfirm = () => {
    setConfirmModal(true);

  };
  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  const supplyToken = () => {
    const underlying = tokenDetails.assetType.toLowerCase();
    const mintPair = { underlying, amount };
    dispatch(supplyTokenAction(mintPair, protocolAddresses, publicKeyHash));
    close();
    setAmount('');
    setTokenText('supply');
    handleOpenConfirm();
  }

  const withdrawToken = () => {
    const underlying = tokenDetails.assetType.toLowerCase();
    const redeemPair = { underlying, amount };

    dispatch(withdrawTokenAction(redeemPair, comptroller, protocolAddresses, server, publicKeyHash, account.address));
    close();
    setAmount('');
    setTokenText('withdraw');
    handleOpenConfirm();
  }

  useEffect(() => {
    dispatch(supplyMarketModalAction(account, markets[tokenDetails['assetType']]));
  }, [dispatch, open]);

  useEffect(() => {
    setAmount('');
  }, [close]);


  const modalHeaderText = enableToken ? '' : `To supply and use ${tokenDetails.banner} as collateral, you will need to enable the token first.`;

  if(supplyMarketModal.borrowLimitUsd) {
    tokenDetails.borrowLimit = supplyMarketModal.borrowLimitUsd.toString();
    tokenDetails.borrowLimitUsed = supplyMarketModal.borrowLimitUsed / 10000;
  }
  return (
    <>
    <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText}/>
    <MarketModal
        headerText = {modalHeaderText}
        APYText = {`${tokenDetails.title} Variable APY Rate`}
        Limit = "Borrow Limit"
        LimitUsed = "Borrow Limit Used"
        amountText = "Wallet Balance"
        open = {open}
        close = {close}
        tokenDetails = {tokenDetails}
        // onClick = {enableToken ? supply : onClick}
        onClick = {onClick}
        // handleClickTabOne = {enableToken ? supplyToken : onClick}
        handleClickTabOne = { supplyToken }
        handleClickTabTwo = { withdrawToken }
        labelOne="Supply"
        labelTwo="Withdraw"
        // buttonOne ={enableToken ? "Supply" : "Enable Token"}
        buttonOne ="Supply"
        buttonTwo = "Withdraw"
        // buttonTwo = {tokenDetails.balance ? "Withdraw" : "No balance to withdraw"}
        btnSub = {classes.btnSub}
        inkBarStyle = {classes.inkBarStyle}
        // visibility={enableToken}
        visibility = {true}
        amount={(e)=>{setAmount(e.target.value)}}
        />
    </>
  )
}

export default SupplyModal;
