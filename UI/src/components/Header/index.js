import React from 'react';
import {NavLink} from "react-router-dom";

import Grid from '@mui/material/Grid';
import { Typography, Button } from '@mui/material';
import Box from '@mui/material/Box';
import LinearProgress from '@mui/material/LinearProgress';
import CustomizedProgressBars from './progressBar';

import {HeaderCon, classes1, Title, useStyles} from "./style";
import tezHeader from '../../assets/tezHeader.svg';
import carbonGrowth from '../../assets/carbonGrowth.svg';
import checkmarkLock from '../../assets/checkmarkLock.svg';
import borrowing from '../../assets/borrowing.svg';
import roundSpeed from '../../assets/roundSpeed.svg';
import questionCircle from '../../assets/questionCircle.svg';

const Header = () => {
  const classes = useStyles();
  // 1. call supplyComposition()
  // 2. plug supplyComposition() results into progress bar
  // 3. plug supplyComposition().totalUsdValue into supplying value display
  // 4. plug supplyComposition().collateralUsdValue into collateral value display
  // and same for borrowing
  return (
    <HeaderCon className={classes1.root}>
      <Grid container justify="center" alignItems="center">
        <Grid item xs={6} sm={3} md={4} lg={3}>
          <img src={tezHeader} alt={tezHeader} className={classes.tezHeader}/>
        </Grid>
        <Grid container item xs={6} sm={6} md={5} lg={5} textAlign="center" className={classes.linkCon}>
          <Grid item sm={4} md={4} lg={4}>
            <NavLink to="dashboard" className={classes.link} activeClassName={classes.activeLink}> Dashboard </NavLink>
          </Grid>
          <Grid item sm={4} md={4} lg={4}>
            <NavLink to="market" className={classes.link} activeClassName={classes.activeLink}> Market </NavLink>
          </Grid>
          <Grid item sm={4} md={4} lg={4}>
            <NavLink to="about" className={classes.link} activeClassName={classes.activeLink}> About </NavLink>
          </Grid>
        </Grid>
        <Grid item lg={2}></Grid>
        <Grid item xs={12} sm={3} md={3} lg={2} className={classes.addWalletCon}>
          <Button className={classes.addWallet}> Add Wallet </Button>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12} className={classes.netAPY}>
          <Typography>
            Net APY: 0.00%
            {/* <span className={classes.questionCircle}>
              <img src={questionCircle} alt={questionCircle} />
            </span> */}
          </Typography>
        </Grid>
      </Grid>
      <Grid container>
        <Grid item xs={12} md={6} className={classes.padding100}>
          <Typography>Supply Composition</Typography>
          <Box className={classes.progressBar}>
            <CustomizedProgressBars />
          </Box>
          <Box sx={{ paddingTop: '55px' }} className={classes.box}>
            <Grid container>
              <Grid container item xs={12} sm={5} lg={3} className={classes.borderRight}>
                <Grid item>
                    <img src={carbonGrowth} alt={"growth"} />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Supplying</Typography>
                    <Typography className={classes.statsValue}>$0.00</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Grid sm={1}></Grid>
              <Grid container item xs={12} sm={6} lg={4}>
                <Grid item>
                    <img src={checkmarkLock} alt={"checkmarkLock"} />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Collateralized</Typography>
                    <Typography className={classes.statsValue}>$0.00</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Grid>
        <Grid item xs={12} md={6} className={classes.padding30}>
          <Typography>Borrow  Limit</Typography>
          <Box className={classes.progressBar}>
            <CustomizedProgressBars />
          </Box>
          <Box sx={{ paddingTop: '55px' }}>
            <Grid container>
              <Grid container item sm={5} lg={3} className={classes.borderRight}>
                <Grid item>
                    <img src={borrowing} alt={"borrowing icon"} />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Borrowing</Typography>
                    <Typography className={classes.statsValue}>$0.00</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Grid sm={1}></Grid>
              <Grid container item sm={6} lg={4}>
                <Grid item>
                    <img src={roundSpeed} alt={"roundSpeed"} />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Borrow limit</Typography>
                    <Typography className={classes.statsValue}>$0.00</Typography>
                  </Box>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </HeaderCon>
  )
}

export default Header;
