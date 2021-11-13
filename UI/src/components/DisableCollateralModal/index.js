import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';

import { useStyles } from './style';

const DisableCollateralModal = (props) =>{
  const classes = useStyles();
  // const dispatch = useDispatch();
  const {open, close, valueofRow, onClick} = props;
  const {supplyMarkets, borrowMarkets, supplyingMarkets} = useSelector(state => state.market.marketData);



  const disableToken = () => {
    valueofRow.collateral = false;
    console.log(valueofRow.title, 'closed!!');
    console.log(valueofRow.collateral, 'vvvvv!!');
    console.log(valueofRow, 'collateralize!!');
    close()
    // update store using thunk
  }


  return (
   <MarketModal
      headerText = "This asset will no longer be used towards your borrowing limit, and can’t be seized in liquidation."
      APYText = {valueofRow.title +" "+ "Variable APY Rate"}
      Limit = "Borrow Limit"
      LimitUsed = "Borrow Limit Used"
      amountText = "Wallet Balance"
      open = {open}
      close = {close}
      valueofRow = {valueofRow}
      onClick = {onClick}
      handleClickTabOne = {disableToken}
      buttonOne = "Disable Token"
      btnSub = {classes.btnSub}
      extraPadding = {classes.collateralizePadding}
      collateralize
      visibility
   />
  )
}

export default DisableCollateralModal;
