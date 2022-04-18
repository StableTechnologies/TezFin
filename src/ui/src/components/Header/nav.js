/* eslint-disable no-unused-expressions */
/* eslint-disable no-undef */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import Popover from '@mui/material/Popover';
import Button from '@mui/material/Button';

import tezHeader from '../../assets/tezHeader.svg';
import CopyIcon from '../../assets/copyIcon.svg';
import DisconnectIcon from '../../assets/disconnectIcon.svg';
import ExchangeIcon from '../../assets/exchangeIcon.svg';

import { shorten, getWallet, deactivateAccount } from '../../util';
import { addWalletAction, disconnectWalletAction } from '../../reduxContent/addWallet/actions';

import { useStyles } from './style';

const Nav = () => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const [tezAccount, setTezAccount] = useState('');
    const [openPopover, setPopover] = useState(null);

    const { address } = useSelector((state) => state.addWallet.account);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const { comptroller, protocolAddresses } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);

    const addWallet = async () => {
        const { address } = await getWallet();
        dispatch(addWalletAction(address, server, protocolAddresses, comptroller, markets));
    };

    const disconnectWallet = async () => {
        setPopover(null);
        await deactivateAccount();
        dispatch(disconnectWalletAction());
    };

    const open = Boolean(openPopover);
    const id = open ? 'connected-wallet-popover' : undefined;

    useEffect(() => {
        setTezAccount(address);
        setPopover(null);
    }, [address]);

    return (
        <Grid container justify="center" alignItems="center">
            <Grid item xs={6} lg={6} className={classes.tezHeaderCon}>
                <img src={tezHeader} alt="tezHeader" className={classes.tezHeader}/>
            </Grid>
            <Grid item xs={6} lg={6} className={classes.addWalletCon}>
                <Button
                    className={`${classes.wallet} ${tezAccount ? classes.connectedWallet : classes.defaultWallet}`}
                    onClick={(e) => { tezAccount ? setPopover(e.currentTarget) : addWallet(); }}
                    disableRipple
                >
                    {(tezAccount && (shorten(6, 6, tezAccount))) || 'Connect Wallet' }
                </Button>
                <Popover
                    id={id}
                    open={open}
                    anchorEl={openPopover}
                    onClose={() => setPopover(null)}
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'left'
                    }}
                    className={classes.root}
                >
                    <Button
                        onClick={() => navigator.clipboard.writeText(tezAccount)}
                        className={`${classes.popoverBtn} ${classes.copyText}`}
                        disableRipple
                    >
                        {tezAccount && shorten(10, 8, tezAccount)} {' '}
                        <img src={CopyIcon} alt="copy icon" className={classes.popoverImg} />
                    </Button>
                    <Button onClick={addWallet} className={classes.popoverBtn} disableRipple>
                        <img src={ExchangeIcon} alt="change icon" className={classes.popoverImg} />
                        {' '} Change Wallet
                    </Button>
                    <Button onClick={disconnectWallet} className={classes.popoverBtn} disableRipple>
                        <img src={DisconnectIcon} alt="disconnect icon" className={classes.popoverImg} />
                        {' '} Disconnect Wallet
                    </Button>
                </Popover>
            </Grid>
        </Grid>
    );
};

export default Nav;
