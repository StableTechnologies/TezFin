import React from 'react';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';

import CustomizedProgressBars from '../ProgressBar';
import { useStyles } from './style';
import { decimalify, nFormatter } from '../../util';

const Composition = (props) => {
    const classes = useStyles();
    const {
        title, data, dataIcon, dataTitle, dataLimitIcon, dataLimitTitle, gridClass, progressBarColor
    } = props;

    return (
        <Grid item xs={12} md={6} className={gridClass}>
            <Typography className={classes.compositionTitle}> {title} </Typography>
            <Box className={classes.progressBar}>
                <CustomizedProgressBars backgroundColor={progressBarColor} height='16px'/>
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
                      ${(data.totalUsdValue > 0) && nFormatter(decimalify((data.totalUsdValue), 18)) || "0.00"}
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
                          (data.collateral > 0) && decimalify((data.collateral), 18, 2)||
                          (data.borrowLimit > 0) && decimalify((data.borrowLimit), 18, 2)
                          // (data.collateral > 0) && nFormatter(decimalify((data.collateral), 18, 2)) ||
                          // (data.borrowLimit > 0) && nFormatter(decimalify((data.borrowLimit), 18, 2))
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
