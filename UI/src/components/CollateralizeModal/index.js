import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import ConfirmModal from '../ConfirmModal';

import MarketModal from '../MarketModal';

import { useStyles } from './style';

const CollateralizeModal = (props) =>{
  const classes = useStyles();
  // const dispatch = useDispatch();
  const {open, close, valueofRow, onClick} = props;

  // const {account} = useSelector(state => state.addWallet);
  // const {markets} = useSelector(state => state.marketModal.supplyMarketModal);
  const {supplyMarkets, borrowMarkets, supplyingMarkets} = useSelector(state => state.market.marketData);

  const [openConfirmModal, setConfirmModal] =useState(false);
  const [tokenText, setTokenText] =useState('');

  const handleOpenConfirm = () => {
    setConfirmModal(true);

  };
  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  const collateralizeToken = () => {
    valueofRow.collateral = true
    console.log(valueofRow, 'collateralize!!');
    close()
    setTokenText('collateral')
    handleOpenConfirm();
  }

  return (
    <>
      <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={valueofRow.title} tokenText= {tokenText}/>
      <MarketModal
          headerText = "Collateralizing an asset increases your borrowing limit. Please use caution as this can also subject your assets to being seized in liquidation."
          APYText = {valueofRow.title +" "+ "Variable APY Rate"}
          Limit = "Borrow Limit"
          LimitUsed = "Borrow Limit Used"
          amountText = "Wallet Balance"
          open = {open}
          close = {close}
          valueofRow = {valueofRow}
          handleClickTabOne = {collateralizeToken}
          buttonOne = "Use as Collateral"
          btnSub = {classes.btnSub}
          extraPadding = {classes.collateralizePadding}
          collateralize
          visibility
      />
    </>
  )
}

export default CollateralizeModal;
