/* eslint-disable no-nested-ternary */
/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import WarningIcon from '@mui/icons-material/Warning';
// eslint-disable-next-line object-curly-newline

import { useStyles } from './style';

const DisclamerModal = (props) => {
    const classes = useStyles();
    const { close } = props;
    const title = 'Please Use Caution';


    const para1 = `While the initial creators of the TezFin (Tezos Finance;
        tezos.finance) protocol have made reasonable 
        efforts to attempt to ensure the security of the 
        contracts and platform, including modeling much of
        the codebase from existing well-audited projects 
        from other blockchains, and by soliciting review from
        friends, nothing approaching the rigor of a formal 
	audit has been conducted at this time`;
        
    const para2  = `We STRONGLY urge caution to anyone who chooses 
        to engage with these contracts and this platform. If 
        you do choose to engage with these contracts and
        this platform, we strongly urge you to only use small
	amounts of assets that you are comfortable losing.`;

     const buttonLabel = 'I understand the risks';

    const [openDisclaimerModal, setDisclaimerModal] = useState(true);

    return (
        <React.Fragment>
            <Dialog
                open={openDisclaimerModal}
                onClose={close}
                className={classes.root}
            >
                <DialogTitle>
                    <div
                        style={{
                            width: '15%',
                            position: 'relative',
                            top: '3px',
                            float: 'left'
                        }}
                    >
                        <WarningIcon color="warning" />
                    </div>
                    <div
                        style={{
                            width: '85%',
                            position: 'relative',
                            float: 'left'
                        }}
                    >
                            {title}
                    </div>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText> {para1} </DialogContentText>
                    <DialogContentText> {para2} </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ flexDirection: 'column' }}>
                    <>
                        <Button
                            className={` ${classes.btnMain} `}
                            onClick={() => {
                                setDisclaimerModal(false);
                            }}
                        >
                            {buttonLabel}
                        </Button>
                    </>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};

export default DisclamerModal;
