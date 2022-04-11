// eslint-disable-next-line no-use-before-define
import React from 'react';

import IconButton from '@mui/material/IconButton';
import { useStyles } from './style';

import closeBtn from '../../assets/close.svg';

const CloseButton = (props) => {
    const { onClick } = props;
    const classes = useStyles();

    return (
        <IconButton aria-label="close" onClick={onClick} className={classes.close} disableRipple>
            <img src={closeBtn} alt="close-button" className={classes.closeBtn} />
        </IconButton>
    );
};

export default CloseButton;
