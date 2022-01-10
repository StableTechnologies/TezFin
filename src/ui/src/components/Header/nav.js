import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import { Button } from '@mui/material';

import tezHeader from '../../assets/tezHeader.svg';
import { shorten, getWallet, getActiveAccount } from '../../util';
import { addWalletAction } from '../../reduxContent/addWallet/actions';

import { useStyles } from './style';

const Nav = () => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const [tezAccount, setTezAccount] = useState('');

    const { address } = useSelector((state) => state.addWallet.account);
    const { server } = useSelector((state) => state.nodes.tezosNode);
    const { comptroller, protocolAddresses } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);

    const addWallet = async () => {
        try {
            const { clients } = await getWallet();
            const address = clients.tezos.account;
            dispatch(addWalletAction(address, server, protocolAddresses, comptroller, markets));
        } catch (error) {}
    };

    useEffect(() => {
        setTezAccount(address);
    }, [addWallet]);

    return (
        <Grid container justify="center" alignItems="center">
            <Grid item xs={6} lg={6} className={classes.tezHeaderCon}>
                <img src={tezHeader} alt="tezHeader" className={classes.tezHeader}/>
            </Grid>
            <Grid item xs={6} lg={6} className={classes.addWalletCon}>
                <Button
                    className={`${classes.wallet} ${tezAccount ? classes.connectedWallet : classes.defaultWallet}`}
                    onClick={addWallet}>
                    {(tezAccount && (shorten(6, 6, tezAccount))) || 'Connect Wallet' }
                </Button>
            </Grid>
        </Grid>
    );
};

export default Nav;
