/* eslint-disable import/no-unresolved */
/* eslint-disable import/extensions */
// eslint-disable-next-line no-use-before-define
import React from 'react';

import Box from '@mui/material/Box';
import { tooltipClasses, Typography } from '@mui/material';
import { decimals } from 'tezoslendingplatformjs';
import { useStyles } from './style';
import { decimalify } from '../../util';
import LightTooltip from '../Tooltip/LightTooltip';

const StackedBars = (props) => {
    const classes = useStyles();

    const { composition } = props;

    return (
        <>
            <Box className={classes.progressBar}>
                {composition.assets && composition.assets.map((bar) => (
                    <LightTooltip
                        sx={{
                            [`& .${tooltipClasses.tooltip}`]: {
                                marginBottom: '15px !important'
                            }
                        }}
                        key={bar.title}
                        title={
                            <>
                                <Typography className={classes.tooltipPrimaryText}>
                                    {`${decimalify(
                                        bar.balanceUnderlying,
                                        decimals[bar.title],
                                        decimals[bar.title]
                                    ).replace(/\.?0+$/, '')} ${bar.title}`}
                                </Typography>
                                <Typography className={classes.tooltipSecondaryText}>
                                    {`$${bar.balanceUnderlyingUsd.toFixed(2)}`}
                                </Typography>
                            </>
                        }
                        placement="top"
                    >
                        <Box
                            data-size="5"
                            className={classes.progress}
                            style={{ background: `${bar.color}`, width: `${bar.rate}%` }}
                        />
                    </LightTooltip>
                ))}
            </Box>
        </>
    );
};

export default StackedBars;
