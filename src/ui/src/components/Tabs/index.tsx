/* eslint-disable import/extensions */
/* eslint-disable import/no-unresolved */
// eslint-disable-next-line no-use-before-define
import React from 'react';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';

import { useStyles } from './style';

type Props = {
  labelOne: string;
  labelTwo: string;
  value: any;
  onChange: any;
  inkBarStyle: string;
};

const Tabulator = (props: Props) => {
    const classes = useStyles();

    const {
        labelOne, labelTwo, value, onChange, inkBarStyle
    } = props;

    return (
        <React.Fragment>
            <Tabs
                value={value}
                onChange={onChange}
                textColor="secondary"
                classes={{ indicator: inkBarStyle }}
                aria-label="secondary tabs"
                className={classes.root}
            >
                <Tab value="one" label={labelOne} disableRipple />
                <Tab value="two" label={labelTwo} disableRipple />
            </Tabs>
        </React.Fragment>
    );
};

export default Tabulator;
