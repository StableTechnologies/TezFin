import React from 'react';
import useStyles, {classes1, Button,} from "./style";

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import Divider from '@mui/material/Divider';

import tezfinLogo from '../../assets/tezfin-logo.svg';


const Home = () => {
  const classes = useStyles();

  return (
    <Grid container className={classes.homeCon}>
      <Grid md={12}></Grid>
      <Grid item md={9}>
        <Typography>Tezos<span>.Finance</span></Typography>
        <Typography>On-chain Savings and Loans | 2021</Typography>
      </Grid>
      <Grid md={12}></Grid>
      <Grid item md={10} textAlign="right">
        <img src={tezfinLogo} alt="tezfin-logo" />
      </Grid>
      <Grid item xs={12} textAlign="center">
        <Button className={classes1.cta}> Sign up for updates! </Button>
      </Grid>
      <Grid item xs={1} textAlign="center"></Grid>
      <Grid item xs={10} textAlign="center">
        <Divider />
      </Grid>
    </Grid>
  )
}

export default Home