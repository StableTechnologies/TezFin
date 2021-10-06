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
import IconButton from '@mui/material/IconButton';

import Tabulator from '../Tabs';
import { useStyles } from './style';

import Tez from '../../assets/largeXTZ.svg';
import closeBtn from '../../assets/close.svg';


const Modal = (props) => {
  const classes = useStyles();

  const {open, close, valueofRow} = props;

  return (
    <React.Fragment>
      <Dialog open={open} className={classes.root}>
        <IconButton aria-label="close" onClick={close} className={classes.close} disableRipple>
          <img src={closeBtn} alt="close-button" className={classes.closeBtn} />
          </IconButton>
        <DialogTitle>
          <div>
            <img src={valueofRow.logo} alt="logo" className={classes.img}/>
            <Typography className={classes.imgTitle}> {valueofRow.banner} </Typography>
          </div>
        </DialogTitle>
        <DialogContent>
          <img src={Tez} alt="logo" className={classes.tezImg}/>
        </DialogContent>
        <DialogContent className={classes.padding0}>
          <DialogContentText>
            To supply and use {valueofRow.banner} as collateral, you will need to enable the token first.
          </DialogContentText>
        </DialogContent>
        <Tabulator labelOne="Supply" labelTwo="Withdraw" />
        <DialogContent className={classes.apyRate}>
          <Grid container>
            <Grid item sm={8}>
              <div>
                <img src={valueofRow.logo} alt="logo" className={classes.img}/>
                <Typography className={classes.imgTitle}> {valueofRow.title} Variable APY Rate </Typography>
              </div>
            </Grid>
            <Grid item sm={2}></Grid>
            <Grid item sm={2}>6.34%</Grid>
          </Grid>
        </DialogContent>
        <DialogContent className={classes.limit}>
          <Grid container textAlign="justify">
            <Grid item sm={7} className={classes.faintFont}> Borrow Limit </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2}> $0.00 </Grid>
          </Grid>
        </DialogContent>
        <DialogContent>
          <Grid container textAlign="justify">
            <Grid item sm={7} className={classes.faintFont}> Borrow Limit Used </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2}> 0% </Grid>
          </Grid>
        </DialogContent>
        <DialogContent>
          <Grid container>
            <Grid item sm={12}>
              <Box className={classes.progressBar}>
                <CustomizedProgressBars />
              </Box>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button className={classes.btn}>Enable Token</Button>
        </DialogActions>
        <DialogContent>
          <Grid container textAlign="justify">
            <Grid item sm={7}> Wallet Balance </Grid>
            <Grid item sm={3}></Grid>
            <Grid item sm={2} className={classes.whiteSpace}> 25 {valueofRow.title} </Grid>
          </Grid>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  )
}

export default Modal;
