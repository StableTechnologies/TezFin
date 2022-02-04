import { Button, Typography } from '@mui/material';
import React, { useEffect, useState } from 'react';
import { BigNumber } from 'bignumber.js';
import bigInt from 'big-integer';

import { decimalify, nFormatter, undecimalify } from '../../util';

import Box from '@mui/material/Box';
import CloseButton from '../CloseButton';
import CustomizedProgressBars from '../ProgressBar';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import Tabulator from '../Tabs';
import TextField from '@mui/material/TextField';
import Tez from '../../assets/largeXTZ.svg';
import { decimals } from 'tezoslendingplatformjs';
import { useSelector } from 'react-redux';
import { useStyles } from './style';

const DashboardModal = (props) => {
	const classes = useStyles();

	const {
		open, close, tokenDetails, handleClickTabOne, handleClickTabTwo, labelOne, labelTwo, APYText, APYTextTwo, Limit,
		LimitUsed, buttonOne, buttonTwo, btnSub, btnSubTwo, inkBarStyle, inkBarStyleTwo, visibility, headerText, amount,
		collateralize, extraPadding, CurrentStateText, CurrentStateTextTwo, mainModal, inputBtnText, maxAction, maxAmount
	} = props;

	const [tabValue, setTabValue] = useState('one');
	const [tokenValue, setTokenValue] = useState('');

  const { account } = useSelector((state) => state.addWallet);
	const { address } = useSelector((state) => state.addWallet.account);

	const handleTabChange = (event, newValue) => {
		setTabValue(newValue);
	};

  const scale = new BigNumber('1000000000000000000000000');
  if(account.health) {
    tokenDetails.borrowLimit = new BigNumber(account.totalCollateralUsd.multiply(bigInt(account.health)).toString()).dividedBy(scale).toFixed(2);
    tokenDetails.borrowLimitUsed = (account.health / 10000).toFixed(2);
  }

	useEffect(() => {
		setTokenValue('');
	}, [close]);

	useEffect(() => {
		setTokenValue(maxAmount)
	}, [maxAmount]);

	return (
    <React.Fragment>
      <Dialog open={open} className={classes.root}>
        <CloseButton onClick={close} />
        <DialogTitle>
          <div>
            <img src={tokenDetails.logo} alt="logo" className={classes.img} />
            <Typography className={`${classes.modalText} ${classes.imgTitle}`}>
              {tokenDetails.walletBalance ? decimalify(tokenDetails.walletBalance.toString(), decimals[tokenDetails.title]) : '0'}
              {" "} {tokenDetails.banner}
            </Typography>
          </div>
        </DialogTitle>
        {(!visibility || collateralize) &&
          <DialogContent>
            <img src={Tez} alt="logo" className={classes.tezImg} />
          </DialogContent>
        }
        {(visibility && !collateralize) ?
        <DialogContent className={classes.formFieldCon}>
          <form className={classes.form}>
            <TextField
              id="tokenValue"
              type="text"
              placeholder="0"
              onInput={(e) => setTokenValue(e.target.value.replace(/"^[0-9]*[.,]?[0-9]*$/, ''))}
              onChange={(e) => amount(undecimalify(e.target.value, decimals[tokenDetails.title]))}
              value={tokenValue}
              inputProps={{ className: classes.inputText }}
              className={classes.textField}
            />
            {mainModal ?
              <Button
                className={classes.inputBtn}
                onClick={() => {maxAction(tabValue);}}
                disableRipple
                >
                {tabValue === 'one' && "Use Max"}
                {tabValue === 'two' && "80% Limit"}
              </Button> :
              <Button
                className={classes.inputBtn}
                onClick={() => {maxAction(tabValue);}}
                disableRipple
              >
                {inputBtnText}
              </Button>
            }
          </form>
          </DialogContent> :
          <DialogContent className={`${classes.padding0} ${extraPadding}`}>
            <DialogContentText> {headerText} </DialogContentText>
          </DialogContent>
        }
        {collateralize ? '':
          <>
            <Tabulator inkBarStyle={mainModal ? ((tabValue === 'one') ? inkBarStyle : inkBarStyleTwo) : inkBarStyle} value={tabValue} onChange={handleTabChange} labelOne={labelOne} labelTwo={labelTwo} />
            <DialogContent className={classes.CurrentState}>
              <Grid container justifyContent="space-between">
                <Grid item sm={7}>
                  {mainModal ?
                    <Typography className={`${classes.modalText} ${classes.imgTitle}`}>
                      {tabValue === 'one' && CurrentStateText}
                      {tabValue === 'two' && CurrentStateTextTwo}
                    </Typography> :
                    <Typography className={`${classes.modalText} ${classes.imgTitle}`}> {CurrentStateText} </Typography>
                  }
                </Grid>
                {mainModal ?
                  <Grid item sm={5} className={`${classes.modalText} ${classes.modalTextRight}`} >
                    {(tabValue === 'one') && (decimalify(tokenDetails.marketSize, decimals[tokenDetails.title]) || "0")}
                    {(tabValue === 'two') && (decimalify(tokenDetails.totalBorrowed, decimals[tokenDetails.title]) || "0")}
                    {" "} {tokenDetails.title}
                  </Grid> :
                  <Grid item sm={5} className={`${classes.modalText} ${classes.modalTextRight}`} >
                    {decimalify(tokenDetails.balanceUnderlying, decimals[tokenDetails.title])} {" "} {tokenDetails.title}
                  </Grid>
                }
              </Grid>
            </DialogContent>
              <DialogContent className={classes.apyRate}>
                  <Grid container justifyContent="space-between">
                    <Grid item sm={9}>
                      <img src={tokenDetails.logo} alt="logo" className={classes.img} />
                      {mainModal ?
                        <Typography className={`${classes.modalText} ${classes.imgTitle}`}>
                          {tabValue === 'one' && APYText}
                          {tabValue === 'two' && APYTextTwo}
                        </Typography> :
                        <Typography className={`${classes.modalText} ${classes.imgTitle}`}> {APYText} </Typography>
                      }
                    </Grid>
                    {mainModal ?
                    <Grid item sm={3} className={`${classes.modalText} ${classes.modalTextRight} ${classes.imgTitle}`} >
                      {(tabValue === 'one') && (tokenDetails.supplyRate ? Number(tokenDetails.supplyRate).toFixed(2) : "0")}
                      {(tabValue === 'two') && (tokenDetails.borrowRate ? Number(tokenDetails.borrowRate).toFixed(2) : "0")}
                      {"%"}
                    </Grid> :
                    <Grid item sm={3} className={`${classes.modalText} ${classes.modalTextRight} ${classes.imgTitle}`} > {Number(tokenDetails.rate).toFixed(2) || "0"} {"%"} </Grid>
                    }
                  </Grid>
              </DialogContent>
          </>
        }
        <DialogContent className={classes.limit}>
          <Grid container textAlign="justify" justifyContent="space-between">
            <Grid item sm={5} className={`${classes.modalText} ${classes.faintFont} ${visibility ? '' : classes.visibility}`}> {Limit} </Grid>
            <Grid item sm={7} className={`${classes.modalText} ${classes.modalTextRight} ${visibility ? '' : classes.visibility}`}>
              ${(tokenDetails.borrowLimit > 0) ? nFormatter(tokenDetails.borrowLimit, 2) : '0.00'}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogContent className={classes.limitUsed}>
          <Grid container textAlign="justify" justifyContent="space-between">
            <Grid item sm={6} className={`${classes.modalText} ${classes.faintFont} ${visibility ? '' : classes.visibility}`}> {LimitUsed} </Grid>
            <Grid item sm={6} className={`${classes.modalText} ${classes.modalTextRight} ${visibility ? '' : classes.visibility}`}> {tokenDetails.borrowLimitUsed || '0'}% </Grid>
          </Grid>
        </DialogContent>
        <DialogContent className={classes.progressBarCon}>
          <Grid container>
            <Grid item xs={12}>
                <Box className={`${classes.progressBar} ${visibility ? '' : classes.visibility}`}>
                    <CustomizedProgressBars value={Number(tokenDetails.borrowLimitUsed)} height="8px"/>
                </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <>
            {collateralize ?
              <Button className={` ${classes.btnMain} ${btnSub} `} onClick={handleClickTabOne} disableRipple>
                {buttonOne}
              </Button> :
              <>
                {(tokenValue && address) ?
                  <>
                    {tabValue === 'one' &&
                      <Button className={` ${classes.btnMain} ${btnSub} `} onClick={handleClickTabOne} disableRipple> {buttonOne} </Button>
                    }
                    {tabValue === 'two' &&
                      <Button className={` ${classes.btnMain} ${mainModal ? ((tabValue === 'one') ? btnSub : btnSubTwo) : btnSub} `} onClick={handleClickTabTwo} disableRipple> {buttonTwo} </Button>
                    }
                  </> :
                  <Button className={` ${classes.btnMain} ${mainModal ? ((tabValue === 'one') ? btnSub : btnSubTwo) : btnSub}`} disabled>
                    {tabValue === 'one' && buttonOne}
                    {tabValue === 'two' && buttonTwo}
                  </Button>
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
