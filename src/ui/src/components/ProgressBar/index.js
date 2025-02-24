/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-use-before-define
import * as React from 'react';
import Box from '@mui/material/Box';

import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { Typography, tooltipClasses } from '@mui/material';
import LightTooltip from '../Tooltip/LightTooltip';


import { progressBarStyles, tooltipStyles } from './style';
import { truncateNum } from '../../util';

const ProgressBar = (props) => {
    const { valuePercentage: value, height } = props;
    const fillerRelativePercentage = (100 / value) * 100;
    const progressBarClass = progressBarStyles();
    return (
        <div
            className={progressBarClass.wrapper}
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={value}
        >
            <div style={{ height }} className={progressBarClass.barContainer}>
                <div
                    className={progressBarClass.filler}
                    style={{ width: `${value}%` }}
                >
                    <div
                        className={progressBarClass.fillerBackground}
                        style={{ width: `${fillerRelativePercentage}%` }}
                    />
                </div>
            </div>

        </div>
    );
};

const CustomizedProgressBars = (props) => {
    const { value, height } = props;
    return (
        <Box sx={{ flexGrow: 1 }}>
            <ProgressBar height={height} valuePercentage={value} />
        </Box>
    );
};

export const ToolTipProgressBars = (props) => {
    const tooltipClass = tooltipStyles();
    const { value, height } = props;
    return (
        <LightTooltip
            sx={{
                [`& .${tooltipClasses.tooltip}`]: {
                    marginBottom: '15px !important'
                }
            }}
            title={
                <>
                    <Typography className={tooltipClass.tooltipPrimaryText}>Borrow Power Used</Typography>
                    <Typography className={tooltipClass.tooltipSecondaryText}>{ value ? `${value > 100 ? 100 : truncateNum(value)}%` : ''}</Typography>
                </>
            }
            placement="top"
            disableHoverListener={value === 0}
            classes={tooltipClass}
            arrow
        >
            <Box sx={{ flexGrow: 1 }}>
                <ProgressBar height={height} valuePercentage={value} />
            </Box>
        </LightTooltip>
    );
};

export default CustomizedProgressBars;
