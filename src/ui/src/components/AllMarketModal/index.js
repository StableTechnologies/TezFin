import React, { useEffect, useState } from 'react';
import { borrowMarketModalAction, borrowTokenAction, repayBorrowTokenAction } from '../../reduxContent/marketModal/actions';
import { useDispatch, useSelector } from 'react-redux';
import { BigNumber } from 'bignumber.js';

import ConfirmModal from '../ConfirmModal';
import MarketModal from '../MarketModal';
import { useStyles } from './style';

const AllMarketModal = (props) => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { open, close, tokenDetails } = props;

    const { account } = useSelector((state) => state.addWallet);
    const { protocolAddresses } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);
    const { borrowMarketModal } = useSelector((state) => state.marketModal);
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

    const supplyToken = () => {
      const underlying = tokenDetails.assetType.toLowerCase();
      const mintPair = { underlying, amount };
      dispatch(supplyTokenAction(mintPair, protocolAddresses, publicKeyHash));
      close();
      setAmount('');
      setTokenText('supply');
      handleOpenConfirm();
    };
    const borrowToken = () => {
      const underlying = tokenDetails.assetType.toLowerCase();
      const borrowPair = { underlying, amount };
      dispatch(borrowTokenAction(borrowPair, protocolAddresses, publicKeyHash));
      close();
      setAmount('');
      setTokenText('borrow');
      handleOpenConfirm();
    };

    useEffect(() => {
        dispatch(borrowMarketModalAction(account, markets[tokenDetails.assetType]));
    }, [dispatch, open]);


    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} />
            <MarketModal
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
                progressBarColor={classes.root}
                visibility={true}
                mainModal={true}
            />
        </>
    );
};

export default AllMarketModal;
