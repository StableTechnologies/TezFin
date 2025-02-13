import { makeStyles } from '@mui/styles';

// eslint-disable-next-line import/prefer-default-export
export const tooltipStyles = makeStyles({
    tooltip: {
        backgroundColor: 'transparent',
        color: '#000',
        marginBottom: '0 !important'
    }
});

// eslint-disable-next-line import/prefer-default-export
export const progressBarStyles = makeStyles({
    wrapper: {
        display: 'flex',
        alignItems: 'center'
    },
    barContainer: {
        flex: '1',
        background: '#EAEAEA',
        overflow: 'hidden'
    },
    fillerBackground: {
        height: 'inherit',
        transition: '"width 2s ease-i-out"',
        background: 'linear-gradient(90deg, '
        + '#00C000 0%, '
        + '#60D000 10%, '
        + '#A0E000 20%, '
        + '#D8E800 35%, '
        + '#FFF000 50%, '
        + '#FFD000 65%, '
        + '#FFA000 80%, '
        + '#FF6000 90%, '
        + '#FF2000 100%'
        + ')'
    },
    filler: {
        transition: '"width 2s ease-i-out"',
        height: 'inherit',
        borderRadius: 'inherit',
        overflow: 'hidden'
    }
});
