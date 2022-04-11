/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    root: {
        '& .MuiSpeedDial-fab': {
            background: 'transparent',
            boxShadow: 'none',
            width: '10.75rem',
            height: '2rem'
        },
        '& .MuiSpeedDial-actions': {
            background: 'transparent',
            boxShadow: 'none',
            position: 'absolute',
            margin: '5rem 0 0',
            padding: '0'
        },
        '& .MuiSpeedDialAction-fab': {
            background: 'transparent',
            boxShadow: 'none'
        }
    },
    speedDial: {
        background: 'transparent'
    }
});

export const tooltipStyles = makeStyles({
    tooltip: {
        backgroundColor: '#fff',
        color: '#000',
        marginBottom: '0 !important',
        fontSize: '0.625rem',
        letterSpacing: '0.005em',
        marginTop: '0px !important',
        boxShadow: '0px 2px 4px 0px rgb(0 0 0 / 25%)'
    }
});
