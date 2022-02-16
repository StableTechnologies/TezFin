import React, { useEffect, useState } from 'react';
import { supplyTokenAction, borrowTokenAction } from '../../util/modalActions';
import { useDispatch, useSelector } from 'react-redux';

import ConfirmModal from '../StatusModal';
import DashboardModal from '../DashboardModal';
import { useStyles } from './style';
import { marketAction } from '../../reduxContent/market/actions';
import { undecimalify, verifyTransaction } from '../../util';

import { decimals } from 'tezoslendingplatformjs';
import { marketsMaxAction } from '../../util/maxAction';

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
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');

    const handleOpenConfirm = () => {
      setConfirmModal(true);
    };
    const handleCloseConfirm = () => {
      setConfirmModal(false);
    };

    const supplyToken = async() => {
      const { response, error} = await supplyTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
      setResponse(response);
      setError(error);
    };

    const borrowToken = async() => {
      const { response, error } = await borrowTokenAction(tokenDetails, amount, close, setTokenText, handleOpenConfirm, protocolAddresses, publicKeyHash);
      setResponse(response);
      setError(error);
    };

    useEffect(() => error &&  setTokenText('error'), [error]);
    useEffect(() => tokenText && handleOpenConfirm(), [tokenText]);
    useEffect(() => setAmount(undecimalify(maxAmount, decimals[tokenDetails.title])), [maxAmount]);

    useEffect(() => {
      if(response) {
        setTokenText('verifying');
        (async () => {
          const confirm = await verifyTransaction(response);
          setConfirm(confirm);
        })()
      }
    }, [response]);

    useEffect(() => {
      if(confirm) {
        setTokenText('success');
        dispatch(marketAction(comptroller, protocolAddresses, server));
      }
    }, [confirm]);

    useEffect(() => {
      setAmount('');
      setMaxAmount('');
    }, [close]);

    return (
        <>
            <ConfirmModal open={openConfirmModal} close={handleCloseConfirm} token={tokenDetails.title} tokenText={tokenText} error={error} />
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
                maxAction={(tabValue) => marketsMaxAction(tabValue, tokenDetails, setMaxAmount)}
                maxAmount= {maxAmount}
            />
        </>
    );
};

export default AllMarketModal;
