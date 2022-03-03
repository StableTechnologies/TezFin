import { makeStyles } from '@mui/styles';

// eslint-disable-next-line import/prefer-default-export
export const useStyles = makeStyles({
    close: {
        position: 'absolute',
        top: '0.8125rem',
        right: '1rem',
        width: '1.5rem',
        height: '1.5rem',
        '&:hover': {
            background: 'transparent'
        }
    },
    closeBtn: {
        width: '1.5rem',
        height: '1.5rem'
    }
});
