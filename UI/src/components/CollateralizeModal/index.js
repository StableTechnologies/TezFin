import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import MarketModal from '../MarketModal';

import { useStyles } from './style';

const CollateralizeModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, valueofRow, onClick} = props;

  const [amount, setAmount] = useState('');
  const [collateralize, setCollateralize] = useState(true);

  const {account} = useSelector(state => state.addWallet);
  const {markets} = useSelector(state => state.marketModal.supplyMarketModal);


  useEffect(() => {
    setAmount('')
  }, [close])

  return (
   <MarketModal
      headerText = "Collateralizing an asset increases your borrowing limit. Please use caution as this can also subject your assets to being seized in liquidation."
      APYText = {valueofRow.title +" "+ "Variable APY Rate"}
      Limit = "Borrow Limit"
      LimitUsed = "Borrow Limit Used"
      amountText = "Wallet Balance"
      open = {open}
      close = {close}
      valueofRow = {valueofRow}
      onClick = {onClick}
      // handleClickTabOne = {enableToken ? mintToken : onClick}
      buttonOne = "Use as Collateral"
      btnSub = {classes.btnSub}
      extraPadding = {classes.collateralizePadding}
      collateralize
      visibility
      amount={(e)=>{setAmount(e.target.value)}}
   />
  )
}

export default CollateralizeModal;
