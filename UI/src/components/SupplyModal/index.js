import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';
import { supplyMarketModalAction } from '../../reduxContent/marketModal/actions';

import { useStyles } from './style';

const SupplyModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow, onClick, enableToken} = props;

  const {account} = useSelector(state => state.addWallet);

  useEffect(() => {
    dispatch(supplyMarketModalAction(account));
  }, [dispatch, account])

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
