import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import LinearProgress, { linearProgressClasses } from '@mui/material/LinearProgress';

const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 8,
    [`&.${linearProgressClasses.colorPrimary}`]: {
        backgroundColor: '#EAEAEA'
    },
    [`& .${linearProgressClasses.bar}`]: {
        backgroundColor: '#3391F6'
    }
}));

const CustomizedProgressBars = (props) => {
    const { value, backgroundColor } = props;

    return (
        <Box sx={{ flexGrow: 1 }}>
            <BorderLinearProgress variant="determinate" value={value || 0} className={backgroundColor}/>
        </Box>
    );
};

export default CustomizedProgressBars;
