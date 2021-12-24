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
        <Grid container justify="center" alignItems="center" className={classes.nav}>
            <Grid item xs={6} sm={3} md={4} lg={3}>
                <img src={tezHeader} alt="tezHeader" className={classes.tezHeader}/>
            </Grid>
            <Grid container item xs={6} sm={6} md={5} lg={5} textAlign="center" className={classes.linkCon}>
                {/*<Grid item sm={4} md={4} lg={4}>
                    <NavLink to="dashboard" className={classes.link} activeClassName={classes.activeLink}> Dashboard </NavLink>
                </Grid>
                <Grid item sm={4} md={4} lg={4}>
                    <NavLink to="market" className={classes.link} activeClassName={classes.activeLink}> Market </NavLink>
                </Grid>
                <Grid item sm={4} md={4} lg={4}>
                    <NavLink to="about" className={classes.link} activeClassName={classes.activeLink}> About </NavLink>
                </Grid>*/}
            </Grid>
            <Grid item lg={2}></Grid>
            <Grid item xs={12} sm={3} md={3} lg={2} className={classes.addWalletCon}>
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
