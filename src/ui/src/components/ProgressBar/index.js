/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-use-before-define
import * as React from 'react';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';

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
        <Tooltip
            title={ value ? `${(value > 100) ? 100 : truncateNum(value)}% Used` : ''}
            placement="top"
            classes={tooltipClass}
        >
            <Box sx={{ flexGrow: 1 }}>
                <ProgressBar height={height} valuePercentage={value} />
            </Box>
        </Tooltip>
    );
};

export default CustomizedProgressBars;
