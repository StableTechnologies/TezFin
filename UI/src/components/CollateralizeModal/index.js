import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { collateralizeTokenAction, supplyMarketModalAction } from '../../reduxContent/marketModal/actions';
import ConfirmModal from '../ConfirmModal';

import MarketModal from '../MarketModal';

import { useStyles } from './style';

const CollateralizeModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();
  const {open, close, tokenDetails, onClick} = props;

  const { account } = useSelector(state => state.addWallet);
  const { markets } = useSelector(state => state.market);
  const { protocolAddresses } = useSelector(state => state.nodes);
  const { supplyMarketModal } = useSelector(state => state.marketModal);
  const publicKeyHash = account.address;

  const [openConfirmModal, setConfirmModal] =useState(false);
  const [tokenText, setTokenText] =useState('');

  const handleOpenConfirm = () => {
    setConfirmModal(true);

  };
  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  const collateralizeToken = () => {
    const assetType = tokenDetails.assetType.toLowerCase();
    dispatch(collateralizeTokenAction(assetType, protocolAddresses, publicKeyHash));
    close()
    setTokenText('collateral')
    handleOpenConfirm();
    tokenDetails.collateral = true;
  }

  useEffect(() => {
    dispatch(supplyMarketModalAction(account, markets[tokenDetails['assetType']]));
  }, [dispatch, open]);

  return (
    <>
      <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText= {tokenText}/>
      <MarketModal
          headerText = "Collateralizing an asset increases your borrowing limit. Please use caution as this can also subject your assets to being seized in liquidation."
          APYText = {tokenDetails.title +" "+ "Variable APY Rate"}
          Limit = "Borrow Limit"
          LimitUsed = "Borrow Limit Used"
          amountText = "Wallet Balance"
          open = {open}
          close = {close}
          tokenDetails = {tokenDetails}
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
