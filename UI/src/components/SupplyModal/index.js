import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';
import { supplyMarketModalAction, supplyTokenAction, withdrawTokenAction } from '../../reduxContent/marketModal/actions';

import { useStyles } from './style';

const SupplyModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow, onClick, supply, enableToken} = props;

  const [amount, setAmount] = useState('');

  const {account} = useSelector(state => state.addWallet);
  const {markets} = useSelector(state => state.marketModal.supplyMarketModal);

  const mintToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const mintPair =  {underlying, amount: amount}
    dispatch( supplyTokenAction(mintPair));
    close();
    setAmount('')
  }

  const withdrawToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const redeemPair =  {underlying, amount: amount}
    dispatch( withdrawTokenAction(redeemPair));
    close();
    setAmount('')
  }

  useEffect(() => {
    dispatch(supplyMarketModalAction(account, markets));
  }, [dispatch, account])

  useEffect(() => {
    setAmount('')
  }, [close])

  if(valueofRow && markets) {
    Object.keys(markets).map((market)=>{
      if(market.toLowerCase() === valueofRow.assetType.toLowerCase()) {
        // valueofRow.apy =  markets[market].rate
        valueofRow.borrowLimit =  markets[market].borrowLimit
        valueofRow.borrowLimitUsed =  markets[market].borrowLimitUsed
      }
    })
  }


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
      handleClickTabOne = {enableToken ? mintToken : onClick}
      handleClickTabTwo = {withdrawToken}
      labelOne="Supply"
      labelTwo="Withdraw"
      buttonOne ={enableToken ? "Supply" : "Enable Token"}
      buttonTwo = "Withdraw"
      // buttonTwo = {valueofRow.balance ? "Withdraw" : "No balance to withdraw"}
      btnSub = {classes.btnSub}
      inkBarStyle = {classes.inkBarStyle}
      visibility={enableToken}
      amount={(e)=>{setAmount(e.target.value)}}
   />
  )
}

export default SupplyModal;
