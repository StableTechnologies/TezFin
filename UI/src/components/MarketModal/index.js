import React, { useState } from 'react';

import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import { Button, Typography } from '@mui/material';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import CustomizedProgressBars from '../Header/progressBar';
import TextField from '@mui/material/TextField';

import Tabulator from '../Tabs';
import CloseButton from '../CloseBtn';
import { useStyles } from './style';

import Tez from '../../assets/largeXTZ.svg';

const MarketModal = (props) => {
  const classes = useStyles();

  const {
      open, close, valueofRow, onClick, labelOne, labelTwo, APYText, Limit, LimitValue, LimitUsed, LimitUsedValue,
      amountText, buttonOne, buttonTwo, btnSub, inkBarStyle, visibility, headerText} = props;

  const [tabValue, setTabValue] = useState('one');
  const [tokenValue, setTokenValue] = useState('');

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
        {!visibility &&
          <DialogContent>
            <img src={Tez} alt="logo" className={classes.tezImg}/>
          </DialogContent>
        }
        <DialogContent className={classes.padding0}>
          {visibility ?
            // <Grid container>
            //   <Grid></Grid>
            //   <Grid></Grid>
              <TextField
                // autoFocus
                id="tokenValue"
                type="text"
                placeholder="0"
                onInput={(e) => setTokenValue(e.target.value.replace(/"^[0-9]*[.,]?[0-9]*$/, ''))}
                value={tokenValue}
                // className={classes.rightAlignText}
                // InputProps={{ disableUnderline: true }}
              />
            // </Grid>
            :
            <DialogContentText> {headerText} </DialogContentText>
          }
        </DialogContent>
        <Tabulator inkBarStyle={inkBarStyle} value={tabValue} onChange={handleTabChange} labelOne={labelOne} labelTwo={labelTwo} />
        <DialogContent className={classes.apyRate}>
          <Grid container>
            <Grid item sm={8}>
              <div>
                <img src={valueofRow.logo} alt="logo" className={classes.img}/>
                <Typography className={classes.imgTitle}> {APYText} </Typography>
              </div>
            </Grid>
            <Grid item sm={2}></Grid>
            <Grid item sm={2}>6.34%</Grid>
          </Grid>
        </DialogContent>
        <DialogContent className={classes.limit}>
          <Grid container textAlign="justify">
            <Grid item sm={7} className={`${classes.faintFont} ${visibility ?"": classes.visibility}`}> {Limit} </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2} className={visibility ?"": classes.visibility}> {LimitValue}</Grid>
          </Grid>
        </DialogContent>
        <DialogContent>
          <Grid container textAlign="justify">
            <Grid item sm={7} className={`${classes.faintFont} ${visibility ?"": classes.visibility}`}> {LimitUsed} </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2} className={visibility ?"": classes.visibility}> {LimitUsedValue} </Grid>
          </Grid>
        </DialogContent>
        <DialogContent>
          <Grid container>
            <Grid item sm={12}>
              <Box className={`${classes.progressBar} ${visibility ?"": classes.visibility}`}>
                <CustomizedProgressBars />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {/* <Button className={classes.btn} onClick={onClick}> */}
          <Button className={` ${classes.btnMain} ${btnSub} `} onClick={onClick}>
            {tabValue === "one" && buttonOne}
            {tabValue === "two" && buttonTwo}
          </Button>
        </DialogActions>
        <DialogContent>
          <Grid container textAlign="justify">
            <Grid item sm={7}> {amountText} </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2} className={classes.whiteSpace}> 25 {valueofRow.title} </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}

export default MarketModal;
