// eslint-disable-next-line no-use-before-define
import * as React from 'react';
import clsx from 'clsx';
import { styled } from '@mui/system';
import { useSwitch } from '@mui/core/SwitchUnstyled';

const BasicSwitchRoot = styled('span')(`
  font-size: 0;
  position: relative;
  display: inline-block;
  width: 40px;
  height: 16px;
  background: #E0E0E0;
  border-radius: 16px;
  cursor: pointer;

  &.Switch-disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  &.Switch-checked {
    background: #39E4B8;
  }
`);

const BasicSwitchInput = styled('input')(`
  cursor: inherit;
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
  border-radius: 50%;
  background-color: #FFF;
  position: relative;
  transition: all 200ms ease;

  &.Switch-focusVisible {
    background-color: rgba(255,255,255,1);
    box-shadow: 0 0 1px 8px rgba(0,0,0,0.25);
  }

  &.Switch-checked {
    left: 25px;
    top: 1.8px;
    background-color: #FFF;
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

    return (
        <BasicSwitchRoot className={clsx(stateClasses)}>
            <BasicSwitchThumb className={clsx(stateClasses)} />
            <BasicSwitchInput {...getInputProps()} aria-label="Demo switch" />
        </BasicSwitchRoot>
    );
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
