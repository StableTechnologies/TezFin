// eslint-disable-next-line no-use-before-define
import React from 'react';
import { useSelector } from 'react-redux';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';

import { ToolTipProgressBars } from '../ProgressBar';
import StackedBars from '../StackedBars/index.tsx';

import { nFormatter } from '../../util';
import { useStyles } from './style';

const Composition = (props) => {
    const classes = useStyles();
    const {
        title, data, dataIcon, dataTitle, dataLimitIcon, dataLimitTitle, gridClass, progressBarColor, supplyBar
    } = props;

    const { totalCollateral } = useSelector((state) => state.supplyComposition.supplyComposition);

    return (
        <Grid item xs={12} md={6} className={gridClass}>
            <Typography className={classes.compositionTitle}> {title} </Typography>
            <Box className={classes.progressBar}>
                {supplyBar
                    ? <StackedBars composition={data} />
                    : <ToolTipProgressBars value={data.borrowUtilization && data.borrowUtilization.toNumber()} backgroundColor={progressBarColor} height='40px'/>
                }
            </Box>
            <Box className={classes.box}>
                <Grid container flexWrap='nowrap'>
                    <Grid container item xs={6} className={classes.boxOne}>
                        <Grid item paddingRight='1rem' alignSelf='flex-end'>
                            <img src={dataIcon} alt="borrowing-icon" className={classes.boxImg}/>
                        </Grid>
                        <Grid item>
                            <Typography className={classes.statsTitle}> {dataTitle} </Typography>
                            <Typography className={classes.statsValue}>
                                ${(
                                    ((data.supplying > 0) && nFormatter(data.supplying))
                                    || ((data.borrowing > 0) && nFormatter(data.borrowing))
                                )
                                || '0.00'
                                }
                            </Typography>
                        </Grid>
                    </Grid>
                    <Grid container item xs={6} className={classes.boxTwo}>
                        <Grid item paddingRight='1rem' alignSelf='flex-end'>
                            <img src={dataLimitIcon} alt="borrowLimit-Icon" className={classes.boxImg}/>
                        </Grid>
                        <Grid item>
                            <Typography className={classes.statsTitle}> {dataLimitTitle} </Typography>
                            <Typography className={classes.statsValue}>
                              ${(
                                    ((data.collateralized > 0) && nFormatter(data.collateralized))
                                    // displaying borrow limit as the total collateral value without deducting value borrowed
                                    || ((totalCollateral > 0) && nFormatter(totalCollateral))
                                )
                                || '0.00'
                                }
                            </Typography>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    );
};

export default Composition;
