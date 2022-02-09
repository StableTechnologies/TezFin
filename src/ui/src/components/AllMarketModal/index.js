import React, { useEffect, useState } from 'react';
import { supplyTokenAction, borrowTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../ConfirmModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { allMarketAction, marketAction, suppliedMarketAction } from '../../reduxContent/market/actions';
import { decimalify, undecimalify } from '../../util';

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
    const [maxAmount, setMaxAmount] = useState('');
    const [openConfirmModal, setConfirmModal] = useState(false);
    const [tokenText, setTokenText] = useState('');
    const [response, setResponse] = useState('');

    const handleOpenConfirm = () => {
      setConfirmModal(true);
    };
    const handleCloseConfirm = () => {
      setConfirmModal(false);
    };

    const maxAction = (tabValue) => {
      if(tabValue === 'one') {
        if(tokenDetails.title.toLowerCase() === "xtz".toLowerCase()){
          setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) - 5);
        }
        else{
          setMaxAmount(decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]));
        }
      }
      if(tabValue === 'two') {
        setMaxAmount('');
      }
    }

    const supplyToken = async() => {
      const response = await supplyTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
      setResponse(response);
    };

    const borrowToken = async() => {
      const response = await borrowTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
      setResponse(response);
    };

    useEffect(() => {
      if(response) {
        dispatch(marketAction(comptroller, protocolAddresses, server));
        setConfirmModal(false);
      }
    }, [response]);

    useEffect(() => {
      setAmount('');
      setMaxAmount('');
    }, [close]);

    useEffect(() => {
      setAmount(undecimalify(maxAmount, decimals[tokenDetails.title]));
    }, [maxAmount]);

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
                setAmount={(e) => { setAmount(e); }}
                visibility={true}
                mainModal={true}
                inputBtnTextOne = "Use Max"
                inputBtnTextTwo = "80% Limit"
                maxAction={(tabValue) => maxAction(tabValue)}
                maxAmount= {maxAmount}
            />
        </>
    );
};

export default AllMarketModal;
