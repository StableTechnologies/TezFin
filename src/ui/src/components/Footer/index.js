import React from 'react';
import { NavLink } from 'react-router-dom';


import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';



import twitter from '../../assets/twitterIcon.svg';
import discord from '../../assets/discordIcon.svg';
import telegram from '../../assets/telegramLogo.svg';

import { useStyles } from './style';



const Footer = () => {
  const classes = useStyles();
  return (
    <Grid className={classes.root}>
      <Grid container className={`${classes.footerCon}`}>
        <Grid item xs={4} sm={3} md={6} alignSelf="center">
          <Typography> &#169; {new Date().getFullYear()} TezFin </Typography>
        </Grid>
        <Grid item xs={8} sm={6} md={4} textAlign="end">
            <NavLink to="dashboard" className={classes.footerLink} activeClassName={classes.activeLink}> Dashboard </NavLink>
            <NavLink to="about" className={classes.footerLink} activeClassName={classes.activeLink}> About </NavLink>
        </Grid>
        <Grid item xs={12} sm={3} md={2} textAlign="end">
          <Link href="" target="_blank" rel="noopener">
            <IconButton disableRipple>
              <img src={twitter} alt="twitter-icon" className={classes.icon}/>
            </IconButton>
          </Link>
          <Link href="" target="_blank" rel="noopener">
            <IconButton disableRipple>
              <img src={discord} alt="discord-icon" className={classes.icon}/>
            </IconButton>
          </Link>
          <Link href="" target="_blank" rel="noopener">
            <IconButton disableRipple>
              <img src={telegram} alt="telegram-icon" className={classes.icon}/>
            </IconButton>
          </Link>
        </Grid>
      </Grid>
      <Grid></Grid>
    </Grid>
  )
}

export default Footer;
