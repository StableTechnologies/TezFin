import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';

import Nav from './nav';
import Composition from './composition';

import { HeaderCon, classes1, useStyles } from './style';
import supplyingIcon from '../../assets/supplyingIcon.svg';
import collateralizedIcon from '../../assets/collateralizedIcon.svg';
import borrowingIcon from '../../assets/borrowing.svg';
import borrowLimitIcon from '../../assets/borrowLimitIcon.svg';
import questionCircle from '../../assets/questionCircle.svg';

import { supplyCompositionAction } from '../../reduxContent/supplyComposition/actions';
import { borrowCompositionAction } from '../../reduxContent/borrowComposition/actions';

const Header = () => {
    const classes = useStyles();
    const dispatch = useDispatch();

    const { supplyComposition } = useSelector((state) => state.supplyComposition);
    const { borrowComposition } = useSelector((state) => state.borrowComposition);
    const account = useSelector((state) => state.addWallet.account);
    const { suppliedMarkets, borrowedMarkets, allMarkets } = useSelector((state) => state.market);


    useEffect(() => {
        if (account) {
            dispatch(supplyCompositionAction(account, suppliedMarkets));
            dispatch(borrowCompositionAction(account, borrowedMarkets));
        }
    }, [dispatch, account, suppliedMarkets, borrowedMarkets]);

    return (
        <HeaderCon className={classes1.root}>
            <Nav />
            <Grid container>
                <Grid item xs={12} className={classes.netAPY}>
                    <Typography className={classes.netAPYText}>
                      Net APY: 0.00% {" "}
                      <img src={questionCircle} alt={"questionIcon"} className={classes.netAPYImg} />
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
                    gridClass={classes.compositionOne}
                    progressBarColor={classes.supplyBarColor} // add class
                    supplyBar
                />
                <Composition
                    title = "Borrow Limit"
                    data = {borrowComposition}
                    dataIcon = {borrowingIcon}
                    dataTitle = "Borrowing"
                    dataLimitIcon = {borrowLimitIcon}
                    dataLimitTitle = "Borrow limit"
                    gridClass={classes.compositionTwo}
                    progressBarColor={classes.borrowBarColor} // add class
                />
            </Grid>
        </HeaderCon>
    );
};

export default Header;
