import React from 'react';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';

import { ToolTipProgressBars } from '../ProgressBar';
import StackedBars from '../StackedBars';

import { decimalify, nFormatter } from '../../util';
import { useStyles } from './style';


const Composition = (props) => {
    const classes = useStyles();
    const {
        title, data, dataIcon, dataTitle, dataLimitIcon, dataLimitTitle, gridClass, progressBarColor, supplyBar
    } = props;


    return (
        <Grid item xs={12} md={6} className={gridClass}>
            <Typography className={classes.compositionTitle}> {title} </Typography>
            <Box className={classes.progressBar}>
              {supplyBar ?
                <StackedBars composition={data} /> :
                <>
                  <ToolTipProgressBars value={Number(data.rate)} backgroundColor={progressBarColor} height='16px'/>
                  <Typography className={classes.limitText}>
                    {data.limitBalance && `$${nFormatter(data.limitBalance,2)} Left`}
                  </Typography>
                </>
              }
            </Box>
            <Box className={classes.box}>
              <Grid container>
                <Grid container item xs={6} className={classes.boxOne}>
                  <Grid item paddingRight='1rem' alignSelf='flex-end'>
                      <img src={dataIcon} alt="borrowing-icon" className={classes.boxImg}/>
                  </Grid>
                  <Grid item>
                    <Typography className={classes.statsTitle}> {dataTitle} </Typography>
                    <Typography className={classes.statsValue}>
                      ${(data.totalUsdValue > 0) && nFormatter(data.totalUsdValue, 2) || "0.00"}
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
                          (data.collateral > 0) && nFormatter(decimalify((data.collateral), 24),2) ||
                          (data.borrowLimit > 0) && nFormatter(data.borrowLimit, 2)
                        ) ||
                        "0.00"
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
