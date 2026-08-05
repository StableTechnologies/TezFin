import { render, screen } from '@testing-library/react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Switch from './components/Switch';
import { isRecoveryMode } from './components/Constants';

const originalEnvironment = process.env.REACT_APP_ENV;
const theme = createTheme();

const renderSwitch = () => render(
    <ThemeProvider theme={theme}>
        <Switch data={{ collateral: true }} />
    </ThemeProvider>
);

afterEach(() => {
    process.env.REACT_APP_ENV = originalEnvironment;
});

test('disables collateral controls in Guard recovery mode', () => {
    process.env.REACT_APP_ENV = 'mainnet';

    renderSwitch();

    expect(isRecoveryMode()).toBe(true);
    expect(screen.getByRole('checkbox')).toBeDisabled();
});

test('enables collateral controls outside Guard recovery mode', () => {
    process.env.REACT_APP_ENV = 'tezosx-previewnet';

    renderSwitch();

    expect(isRecoveryMode()).toBe(false);
    expect(screen.getByRole('checkbox')).toBeEnabled();
});
