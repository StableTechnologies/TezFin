import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { borrowMarketModalAction, borrowTokenAction } from '../../reduxContent/marketModal/actions';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const BorrowModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow} = props;
  const [amount, setAmount] = useState('');

  const {account} = useSelector(state => state.addWallet);


  const borrowToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const borrowPair =  {underlying, amount: amount}
    console.log(borrowPair, 'borrowPair');
    dispatch( borrowTokenAction(borrowPair));
    close();
    setAmount('')
  }

  useEffect(() => {
    dispatch(borrowMarketModalAction(account));
  }, [dispatch, account])
  return (
   <MarketModal
      APYText = "Borrow APY"
      Limit = "Borrow Balance"
      LimitUsed = "Borrow Limit Used"
      amountText = "Currently Borrowing"
      open = {open}
      close = {close}
      valueofRow = {valueofRow}
      handleBtnClick = {borrowToken}
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
