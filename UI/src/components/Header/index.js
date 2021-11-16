import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';

import Nav from './nav';
import Composition from './composition';

import {HeaderCon, classes1, useStyles} from "./style";
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
  const account = useSelector(state => state.addWallet.account);

  console.log(account);
  console.log(supplyComposition, 'supplyComposition');
  console.log(borrowComposition, 'borrowComposition');

  useEffect(() => {
    if(account) {
      dispatch(supplyCompositionAction(account))
      dispatch(borrowCompositionAction(account))
    }
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
        <Composition
          title = "Supply Composition"
          data = {supplyComposition}
          dataIcon = {supplyingIcon}
          dataTitle = "Supplying"
          dataLimitIcon = {collateralizedIcon}
          dataLimitTitle = "Collateralized"
          boxClass={classes.box}
          gridClass={classes.padding100}
          progressBarColor={classes.supplyBarColor} // add class
        />
        <Composition
          title = "Borrow  Limit"
          data = {borrowComposition}
          dataIcon = {borrowingIcon}
          dataTitle = "Borrowing"
          dataLimitIcon = {borrowLimitIcon}
          dataLimitTitle = "Borrow limit"
          progressBarColor={classes.borrowBarColor} // add class
        />
      </Grid>
    </HeaderCon>
  )
}

export default Header;