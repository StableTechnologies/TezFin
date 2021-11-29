import React from 'react';

import Grid from '@mui/material/Grid';
import { Typography } from '@mui/material';
import Box from '@mui/material/Box';

import CustomizedProgressBars from '../ProgessBar';
import { useStyles } from './style';

const Composition = (props) => {
    const classes = useStyles();
    const {
        title, data, dataIcon, dataTitle, dataLimitIcon, dataLimitTitle, gridClass, boxClass, progressBarColor
    } = props;

    return (
        <Grid item xs={12} md={6} className={gridClass}>
            <Typography> {title} </Typography>
            <Box className={classes.progressBar}>
                <CustomizedProgressBars backgroundColor={progressBarColor}/>
            </Box>
            <Box sx={{ paddingTop: '55px' }} className={boxClass}>
                <Grid container>
                    <Grid container item xs={12} sm={5} lg={3} className={classes.borderRight}>
                        <Grid item>
                            <img src={dataIcon} alt="borrowing-icon" />
                        </Grid>
                        <Grid item>
                            <Box sx={{ paddingLeft: '1rem' }}>
                                <Typography className={classes.statsTitle}> {dataTitle} </Typography>
                                <Typography className={classes.statsValue}>${'0.00'}</Typography>
                                {/* <Typography className={classes.statsValue}>${data.totalUsdValue || "0.00"}</Typography> */}
                            </Box>
                        </Grid>
                    </Grid>
                    <Grid item sm={1}></Grid>
                    <Grid container item sm={6} lg={4}>
                        <Grid item>
                            <img src={dataLimitIcon} alt="borrowLimit-Icon" />
                        </Grid>
                        <Grid item>
                            <Box sx={{ paddingLeft: '1rem' }}>
                                <Typography className={classes.statsTitle}> {dataLimitTitle} </Typography>
                                <Typography className={classes.statsValue}>${'0.00'}</Typography>
                                {/* <Typography className={classes.statsValue}>${(data.collateral || data.Limit) || "0.00"}</Typography> */}
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Box>
        </Grid>
    );
};

export default Composition;
