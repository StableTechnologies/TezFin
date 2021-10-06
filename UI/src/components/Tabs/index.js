import React, { useState } from 'react';

import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

import { useStyles } from './style';

const Tabulator = (props) => {
  const classes = useStyles();

  const { labelOne, labelTwo } = props;

  const [value, setValue] = useState('one');

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <React.Fragment>
      <Tabs
        value={value}
        onChange={handleChange}
        textColor="secondary"
        indicatorColor="secondary"
        aria-label="secondary tabs"
        className={classes.root}
      >
        <Tab value="one" label= {labelOne} />
        <Tab value="two" label= {labelTwo} />
      </Tabs>
    </React.Fragment>
  )
}

export default Tabulator;
