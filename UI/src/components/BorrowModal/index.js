import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { borrowMarketModalAction } from '../../reduxContent/marketModal/actions';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const BorrowModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow, onClick} = props;

  const {account} = useSelector(state => state.addWallet);

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
