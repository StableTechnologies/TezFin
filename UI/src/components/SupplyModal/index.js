import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';
import { supplyMarketModalAction, supplyTokenAction, withdrawTokenAction } from '../../reduxContent/marketModal/actions';

import { useStyles } from './style';
import ConfirmModal from '../ConfirmModal';

const SupplyModal = (props) => {
  const classes = useStyles();
  const dispatch = useDispatch();
  const { open, close, valueofRow, onClick, supply, enableToken, mint, withdraw } = props;


  // const account  = JSON.parse(localStorage.getItem('account'));
  const { account } = useSelector(state => state.addWallet);
  const { server } = useSelector(state => state.nodes.tezosNode);
  const { protocolAddresses, comptroller } = useSelector(state => state.nodes);
  const { markets } = useSelector(state => state.market);
  const { supplyMarketModal } = useSelector(state => state.marketModal);
  const [openConfirmModal, setConfirmModal] =useState(false);

  const [amount, setAmount] = useState('');
  const [tokenText, setTokenText] =useState('');

  const handleOpenConfirm = () => {
    setConfirmModal(true);

  };
  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  const mintToken = () => {
    const underlying = valueofRow.assetType.toLowerCase();
    const mintPair = { underlying, amount };

    dispatch(supplyTokenAction(mintPair, protocolAddresses, server));
    close();
    setAmount('');
    setTokenText('supply');
    handleOpenConfirm();
  }

  const withdrawToken = () => {
    const underlying = valueofRow.assetType.toLowerCase();
    const redeemPair = { underlying, amount };

    dispatch(withdrawTokenAction(redeemPair, comptroller, protocolAddresses, server));
    close();
    setAmount('');
    setTokenText('withdraw');
    handleOpenConfirm();
  }

  useEffect(() => {
    dispatch(supplyMarketModalAction(account, markets[valueofRow['assetType']]));
    valueofRow.borrowLimitUsed = supplyMarketModal.borrowLimitUsed / 10000;
  }, [dispatch, open]);

  useEffect(() => {
    setAmount('');
  }, [close]);

  const modalHeaderText = enableToken ? '' : `To supply and use ${valueofRow.banner} as collateral, you will need to enable the token first.`;

  return (
    <>
    <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={valueofRow.title} tokenText={tokenText}/>
    <MarketModal
        headerText = {modalHeaderText}
        APYText = {`${valueofRow.title} Variable APY Rate`}
        Limit = "Borrow Limit"
        LimitUsed = "Borrow Limit Used"
        amountText = "Wallet Balance"
        open = {open}
        close = {close}
        valueofRow = {valueofRow}
        // onClick = {enableToken ? supply : onClick}
        onClick = {onClick}
        // handleClickTabOne = {enableToken ? mintToken : onClick}
        handleClickTabOne = { mintToken }
        handleClickTabTwo = { withdrawToken }
        labelOne="Supply"
        labelTwo="Withdraw"
        // buttonOne ={enableToken ? "Supply" : "Enable Token"}
        buttonOne ="Supply"
        buttonTwo = "Withdraw"
        // buttonTwo = {valueofRow.balance ? "Withdraw" : "No balance to withdraw"}
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
