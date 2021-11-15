import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {NavLink} from "react-router-dom";

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';

import CustomizedProgressBars from './progressBar';
import Nav from './nav';

import {HeaderCon, classes1, Title, useStyles} from "./style";
import supplyingIcon from '../../assets/supplyingIcon.svg';
import collateralizedIcon from '../../assets/collateralizedIcon.svg';
import borrowingIcon from '../../assets/borrowing.svg';
import borrowLimitIcon from '../../assets/borrowLimitIcon.svg';
import questionCircle from '../../assets/questionCircle.svg';

import {supplyCompositionAction} from '../../reduxContent/supplyComposition/actions';
import {borrowCompositionAction} from '../../reduxContent/borrowComposition/actions';
import MobileNav from './mobileNav';

const Header = () => {
  const classes = useStyles();
  const dispatch = useDispatch();

  const {supplyComposition} = useSelector(state => state.supplyComposition);
  const {borrowComposition} = useSelector(state => state.borrowComposition);
  // TODO:
  // 1. call account from the store
  // 2. pass it into supplyCompositionAction and borrowCompositionAction

  useEffect(() => {
    dispatch(supplyCompositionAction())
    dispatch(borrowCompositionAction())
  }, [dispatch])

  return (
    <HeaderCon className={classes1.root}>
      <Nav />
      <MobileNav />
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
                    <img src={supplyingIcon} alt="supplying-Icon" />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Supplying</Typography>
                    <Typography className={classes.statsValue}>${supplyComposition.totalUsdValue}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Grid item sm={1}></Grid>
              <Grid container item xs={12} sm={6} lg={4}>
                <Grid item>
                    <img src={collateralizedIcon} alt="collateralized-Icon" />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Collateralized</Typography>
                    <Typography className={classes.statsValue}>${supplyComposition.collateral}</Typography>
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
                    <img src={borrowingIcon} alt="borrowing-icon" />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Borrowing</Typography>
                    <Typography className={classes.statsValue}>${borrowComposition.totalUsdValue}</Typography>
                  </Box>
                </Grid>
              </Grid>
              <Grid item sm={1}></Grid>
              <Grid container item sm={6} lg={4}>
                <Grid item>
                    <img src={borrowLimitIcon} alt="borrowLimit-Icon" />
                </Grid>
                <Grid item>
                  <Box sx={{paddingLeft: '1rem'}}>
                    <Typography className={classes.statsTitle}>Borrow limit</Typography>
                    <Typography className={classes.statsValue}>${borrowComposition.borrowLimit}</Typography>
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
