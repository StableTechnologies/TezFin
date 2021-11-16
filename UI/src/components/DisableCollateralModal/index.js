import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmModal from '../ConfirmModal';

import MarketModal from '../MarketModal';

import { useStyles } from './style';

const DisableCollateralModal = (props) =>{
  const classes = useStyles();
  // const dispatch = useDispatch();
  const {open, close, valueofRow, onClick} = props;

  const [openConfirmModal, setConfirmModal] =useState(false);
  const [tokenText, setTokenText] =useState('');

  const handleOpenConfirm = () => {
    setConfirmModal(true);

  };
  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  const disableToken = () => {
    valueofRow.collateral = false;
    close()
    setTokenText('disable')
    handleOpenConfirm();
    // update store using thunk to delete
  }


  return (
    <>
      <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={valueofRow.title} tokenText= {tokenText}/>
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

    </>
  )
}

export default DisableCollateralModal;
