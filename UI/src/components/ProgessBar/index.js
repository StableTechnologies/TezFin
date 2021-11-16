import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
  height: 10,
  // borderRadius: 5,
  [`&.${linearProgressClasses.colorPrimary}`]: {
    backgroundColor: theme.palette.grey[theme.palette.mode === 'light' ? 200 : 800],
    backgroundColor: '#EAEAEA',
  },
  [`& .${linearProgressClasses.bar}`]: {
    borderRadius: 5,
    backgroundColor: '#3391F6',
    // background: 'linear-gradient(90deg, #39E4B8 65.26%, rgba(233, 238, 8, 0.99) 79.48%)'

  },
}));


const CustomizedProgressBars = (props)=> {
  const { value, backgroundColor } = props;

  return (
    <Box sx={{ flexGrow: 1 }}>
      <BorderLinearProgress variant="determinate" value={58} className={backgroundColor}/>
    </Box>
  );
}

export default CustomizedProgressBars;