import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

const BorderLinearProgress = styled(LinearProgress)(({ height, value }) => ({
    height: height,
    value: value,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: '#EAEAEA',
    },

    [`& .${linearProgressClasses.bar}`]: {
      background: `${(value < 100) ?
        (`${(value < 80) ?
          `linear-gradient(90deg, #39E4B8 ${100 - value}%, rgba(233, 238, 8, 0.99) 100%)`:
          `linear-gradient(89.97deg, #39E4B8 28.66%, #E9EE08 45.73%, #E9EE08 73.81%, #EE2408 90.33%)`
        }`):
        'red'
      }`
      }
    }));

const CustomizedProgressBars = (props) => {
    const { value, backgroundColor, height } = props;
    return (
        <Box sx={{ flexGrow: 1 }}>
            <BorderLinearProgress
              variant="determinate" value={value || 0}
              className={backgroundColor}
              height={height}
            />
        </Box>
    );
};

export default CustomizedProgressBars;
