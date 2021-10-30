import React from 'react';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const BorrowModal = (props) =>{
  const classes = useStyles();

  const {open, close, valueofRow, onClick} = props;
  return (
   <MarketModal
      APYText = "Borrow APY"
      Limit = "Borrow Balance"
      LimitValue = "0.00"
      LimitUsed = "Borrow Limit Used"
      LimitUsedValue = "0"
      amountText = "Currently Borrowing"
      open = {open}
      close = {close}
      valueofRow = {valueofRow}
      onClick = {onClick}
      labelOne = "Borrow"
      labelTwo = "Repay"
      buttonOne = "Borrow"
      buttonTwo = "Repay"
      btnSub = {classes.btnSub}
      inkBarStyle = {classes.inkBarStyle}
      visibility = {true}
   />
  )
}

export default BorrowModal;
