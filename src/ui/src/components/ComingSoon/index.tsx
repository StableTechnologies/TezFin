// eslint-disable-next-line no-use-before-define
import React from 'react';

import Grid from '@mui/material/Grid';

import comingSoonGif from '../../assets/comingSoon.gif';

const ComingSoon = () => (
    <Grid container>
        <Grid item xs={12} sx={{ background: '#fff' }}>
            <Grid sx={{ width: '70%', margin: 'auto' }}>
                <img src={ comingSoonGif } style={{ width: '100%', height: '80vh' }} />
            </Grid>
        </Grid>
    </Grid>
);

export default ComingSoon;
