import React, { useEffect, useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Button, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import CustomizedProgressBars from '../ProgessBar';
import TextField from '@mui/material/TextField';

import Tabulator from '../Tabs';
import CloseButton from '../CloseButton';
import { useStyles } from './style';

import Tez from '../../assets/largeXTZ.svg';
import { useSelector } from 'react-redux';

const MarketModal = (props) => {
  const classes = useStyles();

  const {
    open, close, valueofRow, handleClickTabOne,handleClickTabTwo, labelOne, labelTwo, APYText, Limit, LimitUsed,
    amountText, buttonOne, buttonTwo, btnSub, inkBarStyle, visibility, headerText, amount, collateralize,
    extraPadding, progressBarColor
  } = props;

    const [tabValue, setTabValue] = useState('one');
    const [tokenValue, setTokenValue] = useState('');

  const { address } = useSelector(state => state.addWallet.account);


    const handleTabChange = (event, newValue) => {
      setTabValue(newValue);
    };

    useEffect(() => {
      setTokenValue('')
    }, [close])

  return (
    <React.Fragment>
      <Dialog open={open} className={classes.root}>
        <CloseButton onClick={close} />
        <DialogTitle>
          <div>
            <img src={valueofRow.logo} alt="logo" className={classes.img}/>
            <Typography className={classes.imgTitle}> {valueofRow.banner} </Typography>
          </div>
        </DialogTitle>
        {(!visibility || collateralize) &&
          <DialogContent>
            <img src={Tez} alt="logo" className={classes.tezImg}/>
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
                onChange={(e)=>amount(e)}
                value={tokenValue}
                inputProps={{className: classes.inputText}}
                className={classes.textField}
              />
              <Button className={classes.inputBtn} disableRipple> Use Max </Button>
            </form>
          </DialogContent>
            :
        <DialogContent className={`${classes.padding0} ${extraPadding}`}>
          <DialogContentText> {headerText} </DialogContentText>
        </DialogContent>
        }
        {collateralize ? ""
          :<>
            <Tabulator inkBarStyle={inkBarStyle} value={tabValue} onChange={handleTabChange} labelOne={labelOne} labelTwo={labelTwo} />
            <DialogContent className={classes.apyRate}>
              <Grid container justifyContent="space-between">
                <Grid item sm={8}>
                  <div>
                    <img src={valueofRow.logo} alt="logo" className={classes.img}/>
                    <Typography className={classes.imgTitle}> {APYText} </Typography>
                  </div>
                </Grid>
                <Grid item sm={2}></Grid>
                <Grid item sm={2}> {valueofRow.rate || "0"}% </Grid>
              </Grid>
            </DialogContent>
          </>
        }
        <DialogContent className={classes.limit}>
          <Grid container textAlign="justify" justifyContent="space-between">
            <Grid item sm={7} className={`${classes.faintFont} ${visibility ? "": classes.visibility}`}> {Limit} </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2} className={visibility ? "" : classes.visibility}> ${(valueofRow.borrowLimit || valueofRow.borrowBalanceUsd) || "0.00"}</Grid>
          </Grid>
        </DialogContent>
        <DialogContent>
          <Grid container textAlign="justify" justifyContent="space-between">
            <Grid item sm={7} className={`${classes.faintFont} ${visibility ? "" : classes.visibility}`}> {LimitUsed} </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2} className={visibility ? "" : classes.visibility}> {valueofRow.borrowLimitUsed || "0"}% </Grid>
          </Grid>
        </DialogContent>
        <DialogContent>
          <Grid container>
            <Grid item sm={12}>
              <Box className={`${classes.progressBar} ${visibility ? "" : classes.visibility}`}>
                <CustomizedProgressBars backgroundColor={progressBarColor} value={valueofRow.borrowLimitUsed} />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <>
          {collateralize ?
            <Button className={` ${classes.btnMain} ${btnSub} `} onClick={ handleClickTabOne } disableRipple> {buttonOne} </Button> :
            <>
              {(tokenValue && address) ?
                <>
                  {tabValue === "one" &&
                    <Button className={` ${classes.btnMain} ${btnSub} `} onClick={ handleClickTabOne} disableRipple> {buttonOne} </Button>
                  }
                  {tabValue === "two" &&
                    <Button className={` ${classes.btnMain} ${btnSub} `} onClick={ handleClickTabTwo } disableRipple> {buttonTwo} </Button>
                  }
                </> :
                <Button className={` ${classes.btnMain} ${btnSub} `} disabled>
                  {tabValue === "one" && buttonOne}
                  {tabValue === "two" && buttonTwo}
                </Button>
              }
            </>
          }
          </>
        </DialogActions>
        <DialogContent>
          <Grid container textAlign="justify" justifyContent="space-between">
            <Grid item sm={7}> {amountText} </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2} className={classes.whiteSpace}> {valueofRow.balance || 0} {valueofRow.title} </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}

export default MarketModal;
