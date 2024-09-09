/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-use-before-define
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';

import { tooltipStyles } from './style';
import { truncateNum } from '../../util';

const BorderLinearProgress = styled(LinearProgress)(({ height, value, width }) => ({
    height,
    width,
    value,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: '#EAEAEA'
    },

    [`& .${linearProgressClasses.bar}`]: {
        background: `${(value < 100)
            ? (`${(value <= 35)
                ? '#39E4B8'
                : (`${(value <= 75)
                    ? `linear-gradient(90deg, #39E4B8 ${(34 * 100) / value}%, rgba(233, 238, 8, 0.99) 100%)`
                    : `linear-gradient(89.97deg, #39E4B8 ${(34 * 100) / value}%, #E9EE08 ${(74 * 100) / value}%, #EE2408 100%)`
                }`)}`)
            : 'red'
        }`
    }
}));

const CustomizedProgressBars = (props) => {
    const { value, backgroundColor, height } = props;
    return (
        <Box sx={{ flexGrow: 1 }}>
            <BorderLinearProgress
                variant="determinate"
                value={value ? ((value > 100) ? 100 : value) : 0}
                className={backgroundColor}
                height={height}
            />
        </Box>
    );
};

export const ToolTipProgressBars = (props) => {
    const tooltipClass = tooltipStyles();
    const { value, backgroundColor, height } = props;

    return (
        <Tooltip
            title={ value ? `${(value > 100) ? 100 : truncateNum(value)}% Used` : ''}
            placement="top"
            classes={tooltipClass}
        >
            <Box sx={{ flexGrow: 1 }}>
                <BorderLinearProgress
                    variant="determinate"
                    value={value ? ((value > 100) ? 100 : value) : 0}
                    className={backgroundColor}
                    height={height}
                />
            </Box>
        </Tooltip>
    );
};

export default CustomizedProgressBars;
