import React from 'react';

import Box from '@mui/material/Box';

import { useStyles, LightTooltip } from './style';
import { truncateNum } from '../../util';

const barData = [
  {name: 'XTZ', width: 30, color: 'violet'},
  {name: 'btctz', width: 10, color: 'red'},
  {name: 'ethtz', width: 5, color: 'pink'},
  {name: 'usdtz', width: 12, color: 'green'},
]

const StackedBars = (props) => {
  const classes = useStyles();

  const { composition } = props;

  return (
    <>
      <Box className={classes.progressBar}>
        {composition.assets && composition.assets.map(bar =>
          <LightTooltip key={bar.title} title={`${truncateNum(bar.rate)}% ${bar.title}`} placement="bottom">
            <Box data-size="5" className={classes.progress} style= {{background:`${bar.color}`, width:`${bar.rate}%` }}/>
          </LightTooltip>
        )}
      </Box>
    </>
  );
}

export default StackedBars;
