import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';
import { supplyMarketModalAction, supplyTokenAction, withdrawTokenAction } from '../../reduxContent/marketModal/actions';

import { useStyles } from './style';
import ConfirmModal from '../ConfirmModal';

const SupplyModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow, onClick, supply, enableToken, mint, withdraw} = props;

  const [amount, setAmount] = useState('');

  const {account} = useSelector(state => state.addWallet);
  const {markets} = useSelector(state => state.marketModal.supplyMarketModal);
  const [openConfirmModal, setConfirmModal] =useState(false);
  const [tokenText, setTokenText] =useState('');

  const handleOpenConfirm = () => {
    setConfirmModal(true);

  };
  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  const mintToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const mintPair =  {underlying, amount: amount}
    dispatch( supplyTokenAction(mintPair));
    close();
    setAmount('')
    setTokenText('supply')
    handleOpenConfirm();
  }

  const withdrawToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const redeemPair =  {underlying, amount: amount}
    dispatch( withdrawTokenAction(redeemPair));
    close();
    setAmount('')
    setTokenText('withdraw')
    handleOpenConfirm();
  }

  if(valueofRow && markets) {
    Object.keys(markets).map((market)=>{
      if(market.toLowerCase() === valueofRow.assetType.toLowerCase()) {
        // valueofRow.apy =  markets[market].rate
        valueofRow.borrowLimit =  markets[market].borrowLimit
        valueofRow.borrowLimitUsed =  markets[market].borrowLimitUsed
      }
    })
  }

  useEffect(() => {
    dispatch(supplyMarketModalAction(account, markets));
  }, [dispatch, account])


  useEffect(() => {
    setAmount('')
  }, [close])

  return (
    <>
    <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={valueofRow.title} tokenText= {tokenText}/>
    <MarketModal
        headerText = {enableToken ? "": "To supply and use" +" "+ valueofRow.banner +" "+ "as collateral, you will need to enable the token first."}
        APYText = {valueofRow.title +" "+ "Variable APY Rate"}
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
        buttonOne ={"Supply"}
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
