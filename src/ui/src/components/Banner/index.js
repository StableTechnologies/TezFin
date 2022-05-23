// eslint-disable-next-line no-use-before-define
import React from 'react';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';

import warning from '../../assets/warning.svg';
import { useStyles } from './style';

const Banner = () => {
    const classes = useStyles();

    return (
        <Grid container flexWrap='nowrap' className={classes.bannerCon} >
            <Grid item className={classes.warningCon}>
                <img src={warning} alt='warning-icon' className={classes.warningIcon} />
            </Grid>
            <Grid item>
                <Typography className={classes.bannerText}> Please Use Caution. </Typography>
                <Typography className={classes.bannerText}>
                  Tezfin has not been audited yet. If you do choose to engage with these contracts and this platform,
                  we strongly urge you to only use small amounts of assets that you are comfortable losing.
                </Typography>
            </Grid>
        </Grid>
    );
};

export default Banner;
