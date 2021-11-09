import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { borrowMarketModalAction, borrowTokenAction, repayBorrowTokenAction } from '../../reduxContent/marketModal/actions';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const BorrowModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow} = props;
  const [amount, setAmount] = useState('');

  const {account} = useSelector(state => state.addWallet);
  const {markets} = useSelector(state => state.marketModal.borrowMarketModal);


  const borrowToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const borrowPair =  {underlying, amount: amount}
    dispatch( borrowTokenAction(borrowPair));
    close();
    setAmount('')
  }

  const repayBorrowToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const repayBorrowPair =  {underlying, amount: amount}
    dispatch( repayBorrowTokenAction(repayBorrowPair));
    close();
    setAmount('')
  }

  if(valueofRow && markets) {
    Object.keys(markets).map((x)=>{
      if(x.toLowerCase() === valueofRow.assetType.toLowerCase()) {
        // valueofRow.apy =  markets[x].rate
        valueofRow.borrowBalance =  markets[x].borrowBalanceUsd
        valueofRow.borrowLimitUsed =  markets[x].borrowLimitUsed
      }
    })
  }


  useEffect(() => {
    dispatch(borrowMarketModalAction(account, markets, valueofRow));
  }, [dispatch, account])
        console.log(valueofRow.apy, 'valueofRow.apy');


  return (
   <MarketModal
      APYText = "Borrow APY"
      Limit = "Borrow Balance"
      LimitUsed = "Borrow Limit Used"
      amountText = "Currently Borrowing"
      open = {open}
      close = {close}
      valueofRow = {valueofRow}
      handleClickTabOne = {borrowToken}
      handleClickTabTwo = {repayBorrowToken}
      labelOne = "Borrow"
      labelTwo = "Repay"
      buttonOne = "Borrow"
      buttonTwo = "Repay"
      btnSub = {classes.btnSub}
      inkBarStyle = {classes.inkBarStyle}
      visibility = {true}
      amount={(e)=>{setAmount(e.target.value)}}
   />
  )
}

export default BorrowModal;
