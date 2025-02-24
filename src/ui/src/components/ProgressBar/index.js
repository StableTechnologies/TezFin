/* eslint-disable no-nested-ternary */
// eslint-disable-next-line no-use-before-define
import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';
import { Typography, tooltipClasses } from '@mui/material';
import LightTooltip from '../Tooltip/LightTooltip';

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
            ? (`${(value < 80)
                ? `linear-gradient(90deg, #39E4B8 ${100 - value}%, rgba(233, 238, 8, 0.99) 100%)`
                : 'linear-gradient(89.97deg, #39E4B8 28.66%, #E9EE08 45.73%, #E9EE08 73.81%, #EE2408 90.33%)'
            }`)
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
                <BorderLinearProgress
                    variant="determinate"
                    value={value ? ((value > 100) ? 100 : value) : 0}
                    className={backgroundColor}
                    height={height}
                />
            </Box>
        </LightTooltip>
    );
};

export default CustomizedProgressBars;
