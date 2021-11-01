import React from 'react';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const SupplyModal = (props) =>{
  const classes = useStyles();
  const {open, close, valueofRow, onClick, enableToken} = props;
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
      onClick = {enableToken ?"": onClick}
      // onClick = {onClick}
      labelOne="Supply"
      labelTwo="Withdraw"
      buttonOne ={enableToken ? "Supply" : "Enable Token"}
      buttonTwo = "No balance to withdraw"
      btnSub = {classes.btnSub}
      inkBarStyle = {classes.inkBarStyle}
      visibility={enableToken}
   />
  )
}

export default SupplyModal;
