import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { KeyStore} from 'conseiljs';

import { borrowMarketModalAction, borrowTokenAction, repayBorrowTokenAction } from '../../reduxContent/marketModal/actions';
import ConfirmModal from '../ConfirmModal';

import MarketModal from '../MarketModal';
import { useStyles } from './style';

const BorrowModal = (props) =>{
  const classes = useStyles();
  const dispatch = useDispatch();

  const { open, close, valueofRow } = props;

  // const account  = JSON.parse(localStorage.getItem('account'));
  const { account } = useSelector(state => state.addWallet);
  const { server } = useSelector(state => state.nodes.tezosNode);
  const { protocolAddresses, comptroller } = useSelector(state => state.nodes);
  const { markets } = useSelector(state => state.market);
  const { borrowMarketModal } = useSelector(state => state.marketModal);
  const publicKeyHash = account.address;


  const [amount, setAmount] = useState('');
  const [openConfirmModal, setConfirmModal] =useState(false);
  const [tokenText, setTokenText] =useState('');

  const handleOpenConfirm = () => {
    setConfirmModal(true);
  };
  const handleCloseConfirm = () => {
    setConfirmModal(false);
  };

  const borrowToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const borrowPair =  {underlying, amount: amount}
    dispatch( borrowTokenAction(borrowPair, comptroller, protocolAddresses, server, publicKeyHash, KeyStore));
    close();
    setAmount('')
    setTokenText('borrow')
    handleOpenConfirm();
  }

  const repayBorrowToken = () => {
    const underlying = valueofRow.assetType.toLowerCase()
    const repayBorrowPair =  {underlying, amount: amount}
    dispatch( repayBorrowTokenAction(repayBorrowPair, protocolAddresses, publicKeyHash));
    close();
    setAmount('');
    setTokenText('repay')
    handleOpenConfirm();
  }

  useEffect(() => {
      dispatch(borrowMarketModalAction(account, markets[valueofRow['assetType']]));
  }, [dispatch, open]);

  if(borrowMarketModal.borrowBalanceUsd) {
    valueofRow.borrowBalanceUsd = borrowMarketModal.borrowBalanceUsd.toString();
    valueofRow.borrowLimitUsed = borrowMarketModal.borrowLimitUsed / 10000;
  }

  return (
    <>
      <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={valueofRow.title} tokenText= {tokenText}/>
      <MarketModal
         APYText = "Borrow APY"
         Limit = "Borrow Balance"
         LimitUsed = "Borrow Limit Used"
         amountText = "Currently Borrowing"
         open = {open}
         close = {close}
         valueofRow = {valueofRow}
         handleClickTabOne = {borrowToken}
         handleClickTabTwo = {repayBorrowToken}
         labelOne = "Borrow"
         labelTwo = "Repay"
         buttonOne = "Borrow"
         buttonTwo = "Repay"
         btnSub = {classes.btnSub}
         inkBarStyle = {classes.inkBarStyle}
         visibility = {true}
         amount={(e)=>{setAmount(e.target.value)}}
         progressBarColor = {classes.root}
      />
    </>
  )
}

export default BorrowModal;
