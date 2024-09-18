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
        background: 'linear-gradient(90deg, #39E4B8 35%, #E9EE08 75%, #EE2408 100%)'
    },
    filler: {
        transition: '"width 2s ease-i-out"',
        height: 'inherit',
        borderRadius: 'inherit',
        overflow: 'hidden'
    }
});
