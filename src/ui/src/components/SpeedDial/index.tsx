/* eslint-disable object-curly-newline */
/* eslint-disable array-element-newline */
// eslint-disable-next-line no-use-before-define
import * as React from 'react';

import Box from '@mui/material/Box';
import SpeedDial from '@mui/material/SpeedDial';
import SpeedDialAction from '@mui/material/SpeedDialAction';

import ExchangeIcon from '../../assets/exchangeIcon.svg';
import CopyIcon from '../../assets/copyIcon.svg';
import DisconnectIcon from '../../assets/disconnectIcon.svg';
import { useStyles, tooltipStyles } from './style';

export default function BasicSpeedDial(props: any) {
    const classes = useStyles();
    const tooltipClass = tooltipStyles();

    const { icon, onClose, onOpen, open, copyAddress, changeWallet, disconnectWallet } = props

    const actions = [
        { icon: <img src={CopyIcon} alt="copy" />, name: 'Copy', onClick: copyAddress },
        { icon: <img src={ExchangeIcon} alt="change" />, name: 'Change', onClick: changeWallet },
        { icon: <img src={DisconnectIcon} alt="disconnect" />, name: 'Disconnect', onClick: disconnectWallet },
    ];

    return (
        <Box className={classes.root}>
            <SpeedDial
                ariaLabel="SpeedDial basic example"
                icon={icon}
                className={classes.speedDial}
                direction="left"
                onClose={onClose}
                onOpen={onOpen}
                open={open}
            >
                {actions.map((action) => (
                    <SpeedDialAction
                        key={action.name}
                        icon={action.icon}
                        tooltipTitle={action.name}
                        tooltipPlacement = "bottom"
                        TooltipClasses={tooltipClass}
                        onClick={action.onClick}
                    />
                ))}
            </SpeedDial>
        </Box>
    );
}
