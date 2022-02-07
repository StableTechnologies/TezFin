import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import { Button } from '@mui/material';

import BasicSpeedDial from '../SpeedDial/index.tsx';

import tezHeader from '../../assets/tezHeader.svg';
import { shorten, getWallet, deactivateAccount } from '../../util';
import { addWalletAction } from '../../reduxContent/addWallet/actions';

import { useStyles } from './style';

const Nav = () => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const [tezAccount, setTezAccount] = useState('');
    const [open, setOpen] = React.useState(false);

    const { address } = useSelector((state) => state.addWallet.account);
    const { server, conseilServerInfo } = useSelector((state) => state.nodes.tezosNode);
    const { comptroller, protocolAddresses } = useSelector((state) => state.nodes);
    const { markets } = useSelector((state) => state.market);

    const addWallet = async () => {
      try {
          const { clients } = await getWallet();
          const address = clients.tezos.account;
          dispatch(addWalletAction(address, server, protocolAddresses, comptroller, markets));
        } catch (error) {}
      };

    const disconnectWallet =async() => {
      await deactivateAccount();
      setTezAccount('');
    }

    useEffect(() => {
      setTezAccount(address);
    }, [address]);

    return (
        <Grid container justify="center" alignItems="center">
            <Grid item xs={6} lg={6} className={classes.tezHeaderCon}>
                <img src={tezHeader} alt="tezHeader" className={classes.tezHeader}/>
            </Grid>
            <Grid item xs={6} lg={6} className={classes.addWalletCon}>
              <BasicSpeedDial
                onClose={() => setOpen(false)}
                onOpen={() => {tezAccount ? setOpen(true) : ''}}
                open={open}
                copyAddress={() => navigator.clipboard.writeText(tezAccount)}
                changeWallet={addWallet}
                disconnectWallet={disconnectWallet}
                icon= {
                  <Box
                    className={`${classes.wallet} ${tezAccount ? classes.connectedWallet : classes.defaultWallet}`}
                    onClick={addWallet}
                    disableRipple
                  >
                    {(tezAccount && (shorten(6, 6, tezAccount))) || 'Connect Wallet' }
                  </Box>
                }
              />
            </Grid>
        </Grid>
    );
};

export default Nav;
