import React, { useState } from 'react';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

import { useStyles } from './style';

const Tabulator = (props) => {
  const classes = useStyles();

  const { labelOne, labelTwo, value, onChange, inkBarStyle } = props;

  return (
    <React.Fragment>
      <Tabs
        value={value}
        onChange={onChange}
        textColor="secondary"
        classes={{ indicator: inkBarStyle}}
        aria-label="secondary tabs"
        className={classes.root}
      >
        <Tab value="one" label= {labelOne} disableRipple/>
        <Tab value="two" label= {labelTwo} disableRipple/>
      </Tabs>
    </React.Fragment>
  )
}

export default Tabulator;
