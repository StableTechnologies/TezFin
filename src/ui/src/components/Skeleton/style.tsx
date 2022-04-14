/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    root: {
        '& .MuiSkeleton-root': {
            background: '#EAEAEA'
        }
    },
    cellConOne: {
        display: 'flex'
    },
    cellConTwo: {
        display: 'flex',
        justifyContent: 'flex-end'
    },
    cellOneImg: {
        display: 'flex',
        width: '2rem',
        height: '2rem',
        '@media(max-width: 768px)': {
            width: '1.5rem',
            height: '1.5rem',
            marginTop: '4px'
        },
        '@media(max-width: 501px)': {
            width: '1rem',
            height: '1rem',
            marginTop: '8px'
        }
    },
    cellText: {
        margin: '0.5rem',
        width: '50%',
        height: '1rem'
    }
});
