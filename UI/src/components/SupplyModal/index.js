import React from 'react';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const SupplyModal = (props) =>{
  const classes = useStyles();
  const {open, close, valueofRow, onClick} = props;
  return (
   <MarketModal
      APYText = {valueofRow.title +" "+ "Variable APY Rate"}
      Limit = "Borrow Limit"
      LimitUsed = "Borrow Limit Used"
      amountText = "Wallet Balance"
      open = {open}
      close = {close}
      valueofRow = {valueofRow}
      onClick = {onClick}
      labelOne="Supply"
      labelTwo="Withdraw"
      buttonOne = "Enable Token"
      buttonTwo = "Withdraw"
      btnSub = {classes.btnSub}
      inkBarStyle = {classes.inkBarStyle}
   />
  )
}

export default SupplyModal;
