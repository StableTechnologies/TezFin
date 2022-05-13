/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { BigNumber } from 'bignumber.js';
import { decimals } from 'tezoslendingplatformjs';

import Box from '@mui/material/Box';
import { Button, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';

// eslint-disable-next-line object-curly-newline
import { decimalify, nFormatter, truncateNum, undecimalify } from '../../util';

import Tabulator from '../Tabs';
import CloseButton from '../CloseButton';
import CustomizedProgressBars from '../ProgressBar';

import { useStyles } from './style';
import LightTooltip from './LightTooltip';

const DashboardModal = (props) => {
    const classes = useStyles();

    const {
        open, close, tokenDetails, handleClickTabOne, handleClickTabTwo, labelOne, labelTwo, APYText, APYTextTwo, Limit,
        LimitUsed, buttonOne, buttonTwo, btnSub, btnSubTwo, inkBarStyle, inkBarStyleTwo, visibility, headerText, setAmount,
        collateralize, extraPadding, CurrentStateText, CurrentStateTextTwo, mainModal, inputBtnTextOne, inputBtnTextTwo,
        maxAction, maxAmount, getProps, disabled, errorText
    } = props;

    const [tabValue, setTabValue] = useState('one');
    const [tokenValue, setTokenValue] = useState('');

    const { address } = useSelector((state) => state.addWallet.account);
    const { totalCollateral } = useSelector((state) => state.supplyComposition.supplyComposition);
    const { borrowing, borrowLimit } = useSelector((state) => state.borrowComposition.borrowComposition);

    let borrowLimitUsed;
    if (borrowing && totalCollateral) {
        borrowLimitUsed = new BigNumber(borrowing).dividedBy(new BigNumber(totalCollateral)).multipliedBy(100);
    }

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        setTokenValue('');
    }, [close]);

    useEffect(() => {
        setTokenValue(maxAmount);
    }, [maxAmount]);

    useEffect(() => {
        if (getProps) {
            getProps(tokenValue, tabValue);
        }
    }, [tokenValue, tabValue]);

    return (
        <React.Fragment>
            <Dialog open={open} onClose={close} className={classes.root}>
                <CloseButton onClick={close} />
                <DialogTitle>
                    <div>
                        <img src={tokenDetails.logo} alt="logo" className={classes.img} />
                        <LightTooltip
                            title={ tokenDetails.walletBalance ? `${tokenDetails.walletBalance}  ${tokenDetails.banner}` : ''}
                            placement="bottom"
                        >
                            <Typography className={`${classes.modalText} ${classes.imgTitle}`}>
                                {tokenDetails.walletBalance ? decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) : '0'}
                                {' '} {tokenDetails.banner}
                            </Typography>
                        </LightTooltip>
                    </div>
                </DialogTitle>
                {(!visibility || collateralize)
                    && <DialogContent>
                        <img src={tokenDetails.fLogo} alt="logo" className={classes.tezImg} />
                    </DialogContent>
                }
                {(visibility && !collateralize)
                    ? <DialogContent className={classes.formFieldCon}>
                        <form className={classes.form}>
                            <TextField
                                id="tokenValue"
                                type="text"
                                placeholder="0"
                                autoComplete='off'
                                onFocus={(e) => { e.target.placeholder = ''; }}
                                onBlur={(e) => { e.target.placeholder = '0'; }}
                                onInput={(e) => setTokenValue(e.target.value.replace(/[^0-9.]/g, ''))}
                                onChange={(e) => setAmount(undecimalify(e.target.value, decimals[tokenDetails.title]))}
                                value={tokenValue}
                                inputProps={{ className: classes.inputText, pattern: '[0-9]+', inputMode: 'decimal' }}
                                className={classes.textField}
                            />
                            <Button
                                className={classes.inputBtn}
                                onClick={() => { maxAction(tabValue); }}
                                disabled={!address && true}
                                disableRipple
                            >
                                {tabValue === 'one' && inputBtnTextOne}
                                {tabValue === 'two' && inputBtnTextTwo}
                            </Button>
                        </form>
                    </DialogContent>
                    : <DialogContent className={`${classes.padding0} ${extraPadding}`}>
                        <DialogContentText> {headerText} </DialogContentText>
                    </DialogContent>
                }
                {collateralize ? ''
                    : <>
                        <Tabulator inkBarStyle={mainModal ? ((tabValue === 'one') ? inkBarStyle : inkBarStyleTwo) : inkBarStyle} value={tabValue} onChange={handleTabChange} labelOne={labelOne} labelTwo={labelTwo} />
                        <DialogContent className={classes.CurrentState}>
                            <Grid container justifyContent="space-between">
                                <Grid item sm={7}>
                                    {mainModal
                                        ? <Typography className={`${classes.modalText} ${classes.imgTitle}`}>
                                            {tabValue === 'one' && CurrentStateText}
                                            {tabValue === 'two' && CurrentStateTextTwo}
                                        </Typography>
                                        : <Typography className={`${classes.modalText} ${classes.imgTitle}`}> {CurrentStateText} </Typography>
                                    }
                                </Grid>
                                {mainModal
                                    ? <Grid item sm={5} className={`${classes.modalText} ${classes.modalTextRight}`} >
                                        {(tabValue === 'one') && (
                                            (tokenDetails.supply.balanceUnderlying > 0)
                                                ? nFormatter(decimalify(tokenDetails.supply.balanceUnderlying, decimals[tokenDetails.title], decimals[tokenDetails.title]))
                                                : '0'
                                        )}
                                        {(tabValue === 'two') && (
                                            (tokenDetails.borrow.balanceUnderlying > 0)
                                                ? nFormatter(decimalify(tokenDetails.borrow.balanceUnderlying, decimals[tokenDetails.title], decimals[tokenDetails.title]))
                                                : '0'
                                        )}
                                        {' '} {tokenDetails.title}
                                    </Grid>
                                    : <Grid item sm={5} className={`${classes.modalText} ${classes.modalTextRight}`} >
                                        {nFormatter(decimalify(tokenDetails.balanceUnderlying, decimals[tokenDetails.title], decimals[tokenDetails.title]))} {' '} {tokenDetails.title}
                                    </Grid>
                                }
                            </Grid>
                        </DialogContent>
                        <DialogContent className={classes.apyRate}>
                            <Grid container justifyContent="space-between">
                                <Grid item sm={9}>
                                    <img src={tokenDetails.logo} alt="logo" className={classes.img} />
                                    {mainModal
                                        ? <Typography className={`${classes.modalText} ${classes.imgTitle}`}>
                                            {tabValue === 'one' && APYText}
                                            {tabValue === 'two' && APYTextTwo}
                                        </Typography>
                                        : <Typography className={`${classes.modalText} ${classes.imgTitle}`}> {APYText} </Typography>
                                    }
                                </Grid>
                                {mainModal
                                    ? <Grid item sm={3} className={`${classes.modalText} ${classes.modalTextRight} ${classes.imgTitle}`} >
                                        {(tabValue === 'one') && (tokenDetails.supplyRate ? truncateNum(tokenDetails.supplyRate) : '0')}
                                        {(tabValue === 'two') && (tokenDetails.borrowRate ? truncateNum(tokenDetails.borrowRate) : '0')}
                                        {'%'}
                                    </Grid>
                                    : <Grid item sm={3} className={`${classes.modalText} ${classes.modalTextRight} ${classes.imgTitle}`} >
                                        {(tokenDetails.rate) ? truncateNum(tokenDetails.rate) : '0'}
                                        {'%'}
                                    </Grid>
                                }
                            </Grid>
                        </DialogContent>
                    </>
                }
                <DialogContent className={classes.limit}>
                    <Grid container textAlign="justify" justifyContent="space-between">
                        <Grid item sm={5} className={`${classes.modalText} ${classes.faintFont} ${visibility ? '' : classes.visibility}`}> {Limit} </Grid>
                        <Grid item sm={7} className={`${classes.modalText} ${classes.modalTextRight} ${visibility ? '' : classes.visibility}`}>
                            {/* ${(tokenDetails.borrowLimit > 0) ? nFormatter(tokenDetails.borrowLimit, 2) : '0.00'} */}
                            ${(borrowLimit > 0) ? nFormatter(borrowLimit, 2) : '0.00'}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogContent className={classes.limitUsed}>
                    <Grid container textAlign="justify" justifyContent="space-between">
                        <Grid item sm={6} className={`${classes.modalText} ${classes.faintFont} ${visibility ? '' : classes.visibility}`}> {LimitUsed} </Grid>
                        <Grid item sm={6} className={`${classes.modalText} ${classes.modalTextRight} ${visibility ? '' : classes.visibility}`}>
                            {(borrowLimitUsed > 0) ? ((borrowLimitUsed > 100) ? 100 : truncateNum(borrowLimitUsed)) : '0'}%
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogContent className={classes.progressBarCon}>
                    <Grid container>
                        <Grid item xs={12}>
                            <Box className={`${classes.progressBar} ${visibility ? '' : classes.visibility}`}>
                                <CustomizedProgressBars value={Number(borrowLimitUsed)} height="8px"/>
                            </Box>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column' }}>
                    <>
                        {collateralize
                            ? <>
                                {!disabled
                                    ? <Button className={` ${classes.btnMain} ${btnSub} `} onClick={handleClickTabOne} disableRipple>
                                        {buttonOne}
                                    </Button>
                                    : <>
                                        <Button className={` ${classes.btnMain} ${btnSub} `} onClick={handleClickTabOne} disabled>
                                            {buttonOne}
                                        </Button>
                                        <Typography className={classes.errorText}>
                                            {errorText}
                                        </Typography>
                                    </>
                                }
                            </>
                            : <>
                                {((tokenValue > 0 && address) && !disabled)
                                    ? <>
                                        {tabValue === 'one'
                                            && <Button className={` ${classes.btnMain} ${btnSub} `} onClick={handleClickTabOne} disableRipple> {buttonOne} </Button>
                                        }
                                        {tabValue === 'two'
                                            && <Button className={` ${classes.btnMain} ${mainModal ? ((tabValue === 'one') ? btnSub : btnSubTwo) : btnSub} `} onClick={handleClickTabTwo} disableRipple> {buttonTwo} </Button>
                                        }
                                        {(tabValue === 'two' && buttonTwo === 'Repay')
                                         && <Typography className={classes.errorText}>
                                             {errorText}
                                         </Typography>
                                        }
                                    </>
                                    : <>
                                        <Button className={` ${classes.btnMain} ${mainModal ? ((tabValue === 'one') ? btnSub : btnSubTwo) : btnSub}`} disabled>
                                            {tabValue === 'one' && buttonOne}
                                            {tabValue === 'two' && buttonTwo}
                                        </Button>
                                        <Typography className={classes.errorText}>
                                            {errorText}
                                        </Typography>
                                    </>
                                }
                            </>
                        }
                    </>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};

export default DashboardModal;
