import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { disableCollateralizeTokenAction, supplyMarketModalAction } from '../../reduxContent/marketModal/actions';
import ConfirmModal from '../ConfirmModal';

import MarketModal from '../MarketModal';

import { useStyles } from './style';

const DisableCollateralModal = (props) =>{
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

  const disableToken = () => {
    const assetType = tokenDetails.assetType;
    dispatch(disableCollateralizeTokenAction(assetType, protocolAddresses, publicKeyHash));
    close()
    setTokenText('disable');
    handleOpenConfirm();
    tokenDetails.collateral = false;
  }

 useEffect(() => {
    dispatch(supplyMarketModalAction(account, markets[tokenDetails['assetType']]));
  }, [dispatch, open]);

  return (
    <>
      <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText= {tokenText}/>
      <MarketModal
         headerText = "This asset will no longer be used towards your borrowing limit, and can’t be seized in liquidation."
         APYText = {tokenDetails.title +" "+ "Variable APY Rate"}
         Limit = "Borrow Limit"
         LimitUsed = "Borrow Limit Used"
         amountText = "Wallet Balance"
         open = {open}
         close = {close}
         tokenDetails = {tokenDetails}
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
