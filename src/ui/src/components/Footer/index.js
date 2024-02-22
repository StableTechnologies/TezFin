// eslint-disable-next-line no-use-before-define
import React from 'react';
import { NavLink } from 'react-router-dom';

import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';

import twitter from '../../assets/twitterIcon.svg';
import discord from '../../assets/discordIcon.svg';
import telegram from '../../assets/telegramLogo.svg';
import copyright from '../../assets/copyright.svg';

import { useStyles } from './style';

const Footer = () => {
    const classes = useStyles();
    return (
        <Grid className={classes.root}>
            <Grid container className={`${classes.footerCon}`}>
                <Grid item xs={12} sm={3} md={2} alignSelf="center">
                    <Typography>
                        <IconButton disableRipple>
                            <img src={copyright} alt="discord-icon" className={classes.copyrightIcon} />
                        </IconButton>{' '}
                        {new Date().getFullYear()} TezFin{' '}
                    </Typography>
                </Grid>
                <Grid
                    item
                    xs={12}
                    sm={9}
                    md={10}
                    textAlign="end"
                    sx={{ display: 'flex', flex: 'nowrap', justifyContent: 'flex-end' }}
                >
                    <NavLink to="dashboard" className={classes.footerLink} activeClassName={classes.activeLink}>
                        Dashboard
                    </NavLink>
                    <Link
                        href="https://docs.tezos.finance/welcome/audit-report"
                        target="_blank"
                        className={classes.footerLink}
                        activeClassName={classes.activeLink}
                    >
                        Security
                    </Link>
                    <Link
                        href="https://docs.tezos.finance"
                        target="_blank"
                        className={classes.footerLink}
                        activeClassName={classes.activeLink}
                    >
                        About
                    </Link>
                    <Link
                        className={classes.betaLink}
                        href="https://beta1.tezos.finance/"
                        target="_blank"
                        rel="noopener"
                    >
                        Beta App
                    </Link>
                    <Link href="https://twitter.com/TezosFinance" target="_blank" rel="noopener">
                        <IconButton disableRipple>
                            <img src={twitter} alt="twitter-icon" className={classes.icon} />
                        </IconButton>
                    </Link>
                    <Link href="https://discord.gg/ccWRCu2Dht" target="_blank" rel="noopener">
                        <IconButton disableRipple>
                            <img src={discord} alt="discord-icon" className={classes.icon} />
                        </IconButton>
                    </Link>
                    <Link href="https://t.me/TezFin" target="_blank" rel="noopener">
                        <IconButton disableRipple>
                            <img src={telegram} alt="telegram-icon" className={classes.icon} />
                        </IconButton>
                    </Link>
                </Grid>
            </Grid>
        </Grid>
    );
};

export default Footer;
