import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';
import { supplyMarketModalAction, supplyTokenAction } from '../../reduxContent/marketModal/actions';

import { useStyles } from './style';

const SupplyModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow, onClick, supply, enableToken} = props;

  const [amount, setAmount] = useState('');

  const {account} = useSelector(state => state.addWallet);

  const mintToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const mintPair =  {underlying, amount: amount}
    console.log(mintPair, 'mintPair');
    dispatch( supplyTokenAction(mintPair));
    close();
    setAmount('')
  }

  useEffect(() => {
    dispatch(supplyMarketModalAction(account));
  }, [dispatch, account])

  useEffect(() => {
    setAmount('')
  }, [close])



  return (
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
      handleBtnClick = {enableToken ? mintToken : onClick}
      labelOne="Supply"
      labelTwo="Withdraw"
      buttonOne ={enableToken ? "Supply" : "Enable Token"}
      buttonTwo = "No balance to withdraw"
      btnSub = {classes.btnSub}
      inkBarStyle = {classes.inkBarStyle}
      visibility={enableToken}
      amount={(e)=>{setAmount(e.target.value)}}
   />
  )
}

export default SupplyModal;
