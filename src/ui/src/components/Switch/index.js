// eslint-disable-next-line no-use-before-define
import * as React from 'react';
import clsx from 'clsx';
import { styled } from '@mui/system';
import { useSwitch } from '@mui/core/SwitchUnstyled';
import  MuiSwitch from '@mui/material/Switch';

const CustomSwitch = styled((props) => (
  <MuiSwitch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
))(({ theme }) => ({
  width: 42,
  height: 26,
  padding: 0,
  '& .MuiSwitch-switchBase': {
    padding: 0,
    marginTop: 2.5,
    margin: 2,
    transitionDuration: '300ms',
    transform: 'translateX(1px) scale(0.5)',
    color: '#79747E',
    '&.Mui-checked': {
	    width: "22px",
	    height: "22px",
      transform: 'translateX(18px)',
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
    '&.Mui-focusVisible .MuiSwitch-thumb': {
    },
    '&.Mui-disabled + .MuiSwitch-thumb': {
    },
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
	
const BasicSwitchRoot = styled('span')(`
  font-size: 0;
  position: relative;
  display: inline-block;
  width: 40px;
  height: 16px;
  background: #E0E0E0;
  border-radius: 16px;
  cursor: pointer;
  border: 10px;

  &.Switch-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.Switch-checked {
    border: 2px solid red;
    color: red;
    background: blue;
  }
`);

const BasicSwitchInput = styled('input')(`
  cursor: inherit;
  border: 200px;
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  opacity: 0;
  z-index: 1;
  margin: 0;
`);

const BasicSwitchThumb = styled('span')(`
  display: block;
  width: 12px;
  height: 12px;
  top: 1.8px;
  left: 3px;
  Border: 2px;
  border-radius: 50%;
  background-color: #FFF;
  position: relative;
  transition: all 200ms ease;

    color: black;
  &.Switch-focusVisible {
    background-color: rgba(255,255,255,1);
    box-shadow: 0 0 1px 8px rgba(0,0,0,0.25);
    color: black;
  }

  &.Switch-checked {
    left: 25px;
    top: 1.8px;
    background-color: #FFF;
    color: black;
  }

  &.Mui-checked {
    color: black;
  }

`);

function BasicSwitch(props) {
    const {
        getInputProps, checked, disabled, focusVisible
    } = useSwitch(props);

    const stateClasses = {
        'Switch-checked': checked,
        'Switch-disabled': disabled,
        'Switch-focusVisible': focusVisible
    };
	return (<CustomSwitch />);
   // return (
   //     <BasicSwitchRoot className={clsx(stateClasses)}>
   //         <BasicSwitchThumb className={clsx(stateClasses)} />
   //         <BasicSwitchInput {...getInputProps()} aria-label="Demo switch" />
   //     </BasicSwitchRoot>
   // );
}
export default function Switch(props) {
    const { data } = props;

    return (
        <div>
            <BasicSwitch
                checked={data.collateral}
                inputProps={{ 'aria-label': 'controlled' }}
            />
        </div>
    );
}
