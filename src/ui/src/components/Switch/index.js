// eslint-disable-next-line no-use-before-define
import React, { forwardRef } from 'react';
import { styled } from '@mui/system';
import { useSwitch } from '@mui/core/SwitchUnstyled';
import MuiSwitch from '@mui/material/Switch';

const CustomSwitch = styled(
    forwardRef((props, ref) => (
        <MuiSwitch
            focusVisibleClassName=".Mui-focusVisible"
            disableRipple
            ref={ref} 
            {...props}
        />
    )),
)(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
        padding: 0,
        margin: 2.9,
        transitionDuration: '300ms',
        transform: 'translateX(1px) scale(0.5)',
        color: '#79747E',
        '&.Mui-checked': {
            padding: 0,
            margin: 2,
            width: '22px',
            height: '22px',
            transform: 'translateX(18px) scale(1)',
            color: '#EADDFF',
            '& + .MuiSwitch-track': {
                border: '0px solid red',
                backgroundColor: '#9F329F',
                opacity: 1,
                border: 0,
            },
            '&.Mui-disabled': {
                border: '6px solid #fff',
                opacity: 0.5,
            },
        },
        '&.Mui-focusVisible .MuiSwitch-thumb': {},
        '&.Mui-disabled + .MuiSwitch-thumb': {},
    },
    '& .MuiSwitch-thumb': {
        boxSizing: 'border-box',
    },
    '& .MuiSwitch-track': {
        border: '2px solid #79747E',
        borderRadius: 26 / 2,
        backgroundColor: '#E6E0E9',
        opacity: 1,
        transition: theme.transitions.create(['background-color'], {
            duration: 500,
        }),
    },
}));

const BasicSwitch = forwardRef((props, ref) => {
    const { getInputProps, checked, disabled } = useSwitch(props);

    return (
        <CustomSwitch
            ref={ref} 
            checked={checked}
            disabled={disabled}
            {...getInputProps()}
        />
    );
});

// Switch component
export default function Switch(props) {
    const { data } = props;

    return (
        <div>
            <BasicSwitch checked={data.collateral} inputProps={{ 'aria-label': 'custom switch' }} />
        </div>
    );
}
