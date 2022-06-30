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
        open, close, tokenDetails, handleClickTabOne, handleClickTabTwo, labelOne, labelTwo, APYText, APYTextTwo, buttonOne, buttonTwo, btnSub, btnSubTwo, inkBarStyle, inkBarStyleTwo, visibility, headerText, setAmount,
        collateralize, extraPadding, CurrentStateText, CurrentStateTextTwo, mainModal, inputBtnTextOne, inputBtnTextTwo,
        useMaxAmount, getProps, disabled, errorText, pendingLimit, pendingLimitUsed
    } = props;

    const [tabValue, setTabValue] = useState('one');
    const [tokenValue, setTokenValue] = useState('');
    const [limit, setLimit] = useState('');
    const [limitUsed, setLimitUsed] = useState('');

    const { address, underlyingBalances, isKeyRevealed } = useSelector((state) => state.addWallet.account);
    const { totalCollateral } = useSelector((state) => state.supplyComposition.supplyComposition);
    const { borrowing, borrowLimit } = useSelector((state) => state.borrowComposition.borrowComposition);

    const tezBalance = decimalify(underlyingBalances?.XTZ.toString(), decimals.XTZ);
    const isDisabled = !(tokenValue > 0 && address) || disabled;

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    useEffect(() => {
        setTokenValue('');
    }, [close]);

    useEffect(() => {
        if (getProps) {
            getProps(tokenValue, tabValue);
        }
    }, [tokenValue, tabValue]);

    useEffect(() => {
        setLimit(borrowLimit);
        setLimitUsed(new BigNumber(borrowing).dividedBy(new BigNumber(totalCollateral)).multipliedBy(100));
    }, [borrowing, borrowLimit]);

    return (
        <React.Fragment>
            <Dialog open={open} onClose={close} className={classes.root}>
                <CloseButton onClick={close} />
                {!collateralize
                    && <DialogTitle>
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
                }
                {(!visibility || collateralize)
                    && <Box className={classes.fTokenImgCon}>
                        <img src={tokenDetails.fLogo} alt="logo" className={classes.fTokenImg} />
                    </Box>
                }
                {(visibility && !collateralize)
                    ? <Box className={classes.formFieldCon}>
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
                                onClick={() => setTokenValue(useMaxAmount)}
                                disabled={!address && true}
                                disableRipple
                            >
                                {tabValue === 'one' && inputBtnTextOne}
                                {tabValue === 'two' && inputBtnTextTwo}
                            </Button>
                        </form>
                    </Box>
                    : <Box className={`${classes.contentBoxOne} ${extraPadding} ${classes.borderTop0}`}>
                        <Typography className={`${classes.headerText} ${classes.margin0}`}> {headerText} </Typography>
                    </Box>
                }
                <>
                    {collateralize
                        ? ''
                        : <Tabulator inkBarStyle={mainModal ? ((tabValue === 'one') ? inkBarStyle : inkBarStyleTwo) : inkBarStyle} value={tabValue} onChange={handleTabChange} labelOne={labelOne} labelTwo={labelTwo} />
                    }
                    <Box className={`${classes.contentBoxOne} ${classes.borderBottom0}`}>
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
                    </Box>
                    {collateralize
                        ? ''
                        : <Box className={classes.contentBoxOne}>
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
                                        {(tabValue === 'one') && (tokenDetails.supplyRate ? truncateNum(decimalify(tokenDetails.supplyRate.toString(), 18)) : '0')}
                                        {(tabValue === 'two') && (tokenDetails.borrowRate ? truncateNum(decimalify(tokenDetails.borrowRate.toString(), 18)) : '0')}
                                        {'%'}
                                    </Grid>
                                    : <Grid item sm={3} className={`${classes.modalText} ${classes.modalTextRight} ${classes.imgTitle}`} >
                                        {(tokenDetails.rate) ? truncateNum(decimalify(tokenDetails.rate.toString(), 18)) : '0'}
                                        {'%'}
                                    </Grid>
                                }
                            </Grid>
                        </Box>
                    }
                </>
                <Box className={`${classes.contentBoxTwo} ${classes.limit}`}>
                    <Grid container textAlign="justify" justifyContent="space-between">
                        <Grid item sm={5} className={`${classes.modalText} ${classes.faintFont} ${visibility ? '' : classes.visibility}`}> Borrow Limit </Grid>
                        <Grid item sm={7} className={`${classes.modalText} ${classes.modalTextRight} ${visibility ? '' : classes.visibility}`}>
                            ${pendingLimit
                                ? ((pendingLimit > 0) ? nFormatter(pendingLimit, 2) : '0.00')
                                : ((limit > 0) ? nFormatter(limit, 2) : '0.00')
                            }
                        </Grid>
                    </Grid>
                </Box>
                <Box className={`${classes.contentBoxTwo} ${classes.limitUsed}`}>
                    <Grid container textAlign="justify" justifyContent="space-between">
                        <Grid item sm={6} className={`${classes.modalText} ${classes.faintFont} ${visibility ? '' : classes.visibility}`}> Borrow Limit Used </Grid>
                        <Grid item sm={6} className={`${classes.modalText} ${classes.modalTextRight} ${visibility ? '' : classes.visibility}`}>
                            {(address && pendingLimitUsed)
                                ? ((pendingLimitUsed > 0) ? ((pendingLimitUsed > 100) ? 100 : truncateNum(pendingLimitUsed)) : '0')
                                : ((limitUsed > 0) ? ((limitUsed > 100) ? 100 : truncateNum(limitUsed)) : '0')
                            }%
                        </Grid>
                    </Grid>
                </Box>
                <Box className={`${classes.contentBoxTwo} ${classes.progressBarCon}`}>
                    <Grid container>
                        <Grid item xs={12}>
                            <Box className={`${classes.progressBar} ${visibility ? '' : classes.visibility}`}>
                                <CustomizedProgressBars value={(address && pendingLimitUsed) ? Number(pendingLimitUsed) : Number(limitUsed)} height="8px"/>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
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
                                        <Typography className={classes.warningText}>
                                            {errorText}
                                        </Typography>
                                    </>
                                }
                            </>
                            : <>
                                {!isDisabled
                                    ? <>
                                        {tabValue === 'one'
                                            && <Button className={` ${classes.btnMain} ${btnSub} `} onClick={handleClickTabOne} disableRipple> {buttonOne} </Button>
                                        }
                                        {tabValue === 'two'
                                            && <Button className={` ${classes.btnMain} ${mainModal ? ((tabValue === 'one') ? btnSub : btnSubTwo) : btnSub} `} onClick={handleClickTabTwo} disableRipple> {buttonTwo} </Button>
                                        }
                                        {(tabValue === 'two' && buttonTwo === 'Repay')
                                         && <Typography className={classes.warningText}>
                                             {errorText}
                                         </Typography>
                                        }
                                        <Typography className={classes.warningText}>
                                            {!isKeyRevealed
                                                ? 'You need to perform a reveal operation with your new wallet (for example send XTZ) in order to interact with TezFin.'
                                                : (new BigNumber(tezBalance).lt(0.25)
                                                    && 'Your XTZ balance is low. You may soon not be able to process any new operation if you don\'t add XTZ to your wallet.'
                                                )
                                            }
                                        </Typography>
                                    </>
                                    : <>
                                        <Button className={` ${classes.btnMain} ${mainModal ? ((tabValue === 'one') ? btnSub : btnSubTwo) : btnSub}`} disabled>
                                            {tabValue === 'one' && buttonOne}
                                            {tabValue === 'two' && buttonTwo}
                                        </Button>
                                        <Typography className={classes.warningText}>
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
