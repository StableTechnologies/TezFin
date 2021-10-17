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

import Tabulator from '../Tabs';
import CloseButton from '../closeBtn';
import ConfirmModal from '../confirmModal';
import { useStyles } from './style';

import Tez from '../../assets/largeXTZ.svg';

const Modal = (props) => {
  const classes = useStyles();

  const {open, close, valueofRow, onClick} = props;

  const [openConfirmModal, setConfirmModal] =useState(false);

  const handleClickConfirm = () => {
    close();
    setConfirmModal(true);
  };

  const handleCloseConfirm = () => {
    setConfirmModal(false);
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
          <Button className={classes.btn} onClick={onClick}>Enable Token</Button>
          {/* {setConfirmModal &&
            <ConfirmModal open={openConfirmModal} close1={handleCloseConfirm}/>
          } */}
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
