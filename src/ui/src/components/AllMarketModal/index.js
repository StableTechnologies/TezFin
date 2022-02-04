import React, { useEffect, useState } from 'react';
import { supplyTokenAction, borrowTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../ConfirmModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { allMarketAction, marketAction, suppliedMarketAction } from '../../reduxContent/market/actions';
import { decimalify } from '../../util';

import { decimals } from 'tezoslendingplatformjs';

const AllMarketModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { open, close, tokenDetails } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses, comptroller } = useSelector((state) => state.nodes);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const publicKeyHash = account.address;

    const [amount, setAmount] = useState('');
    const [openConfirmModal, setConfirmModal] = useState(false);
    const [tokenText, setTokenText] = useState('');

    const handleOpenConfirm = () => {
      setConfirmModal(true);
    };
    const handleCloseConfirm = () => {
      setConfirmModal(false);
    };

    const maxAction = (tabValue) => {
      if(tabValue === 'one') {
        if(tokenDetails.title.toLowerCase() === "xtz".toLowerCase()){
          setAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5);
        }
        else{
          setAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
        }
      }
      if(tabValue === 'two') {
        setAmount('');
      }
    }

    const supplyToken = async() => {
      const underlying = tokenDetails.assetType.toLowerCase();
      const mintPair = { underlying, amount };
      close();
      setAmount('');
      setTokenText('supply');
      handleOpenConfirm();
      const response = await supplyTokenAction(mintPair, protocolAddresses, publicKeyHash);
      if(response) {
        dispatch(marketAction(comptroller, protocolAddresses, server));
        setConfirmModal(false);
      }
    };

    const borrowToken = async() => {
      const underlying = tokenDetails.assetType.toLowerCase();
      const borrowPair = { underlying, amount };
      close();
      setAmount('');
      setTokenText('borrow');
      handleOpenConfirm();
      const response = await borrowTokenAction(borrowPair, protocolAddresses, publicKeyHash);
      if(response) {
        dispatch(marketAction(comptroller, protocolAddresses, server));
        setConfirmModal(false);
      }
    };

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} />
            <DashboardModal
                APYText={`${tokenDetails.title} Variable APY Rate`}
                APYTextTwo="Borrow APY"
                Limit="Borrow Limit"
                LimitUsed="Borrow Limit Used"
                CurrentStateText= "Currently Supplying"
                CurrentStateTextTwo= "Currently Borrowing"
                open={open}
                close={close}
                tokenDetails={tokenDetails}
                handleClickTabOne={supplyToken}
                handleClickTabTwo={borrowToken}
                labelOne="Supply"
                labelTwo="Borrow"
                buttonOne="Supply"
                buttonTwo="Borrow"
                btnSub={classes.btnSub}
                btnSubTwo={classes.btnSubTwo}
                inkBarStyle={classes.inkBarStyle}
                inkBarStyleTwo={classes.inkBarStyleTwo}
                amount={(e) => { setAmount(e); }}
                visibility={true}
                mainModal={true}
                inputBtn = "Use Max"
                maxAction={(tabValue) => maxAction(tabValue)}
                maxAmount= {amount}
            />
        </>
    );
};

export default AllMarketModal;
