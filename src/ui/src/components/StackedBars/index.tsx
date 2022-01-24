import React from 'react';

import Box from '@mui/material/Box';

import { useStyles, LightTooltip } from './style';

const barData = [
  {name: 'XTZ', width: 30, color: 'violet'},
  {name: 'btctz', width: 10, color: 'red'},
  {name: 'ethtz', width: 5, color: 'pink'},
  {name: 'usdtz', width: 12, color: 'green'},
]

const StackedBars = (props) => {
  const classes = useStyles();

  const { barData2 } = props;

  return (
    <>
      <Box className={classes.progressBar}>
        {barData && barData.map(bar =>
          <LightTooltip title = {`${bar.width}% ${bar.name}`} placement="bottom">
            <Box data-size="5" className={classes.progress} style= {{background:`${bar.color}`, width:`${bar.width}%` }}/>
          </LightTooltip>
        )}
      </Box>
    </>
  );
}

export default StackedBars;
