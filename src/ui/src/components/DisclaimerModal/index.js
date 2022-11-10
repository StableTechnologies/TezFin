// eslint-disable-next-line no-use-before-define
import React, { useState } from 'react';
import { Button, Typography } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

import WarningIcon from '../../assets/warning.svg';

import { useStyles } from './style';

const DisclamerModal = (props) => {
    const classes = useStyles();
    const { close } = props;
    const title = 'Please Exercise Caution';

    const para1 = `While the initial creators of the TezFin protocol have made reasonable
        efforts to attempt to ensure the security of the
        contracts and platform, including modeling much of
        the codebase from existing well-audited projects
        from other blockchains, and by soliciting review from
        friends, nothing approaching the rigor of a formal
        audit has been conducted at this time.`;

    const para2 = `We STRONGLY urge caution to anyone who chooses
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
                className={classes.root}>
                <DialogTitle className={classes.headerCon}>
                    <img
                        src={WarningIcon}
                        alt='warning-icon'
                        className={classes.warningIcon}
                    />
                    <Typography className={classes.title}>{title}</Typography>
                </DialogTitle>
                <DialogContent>
                    <DialogContentText> {para1} </DialogContentText>
                    <DialogContentText> {para2} </DialogContentText>
                </DialogContent>
                <DialogActions className={classes.btnCon}>
                    <Button
                        className={` ${classes.btnMain} `}
                        onClick={() => {
                            setDisclaimerModal(false);
                        }}>
                        {buttonLabel}
                    </Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
};

export default DisclamerModal;
