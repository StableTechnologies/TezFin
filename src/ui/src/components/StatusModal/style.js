/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
    root: {
        '& .MuiDialog-paper': {
            width: '472px',
            height: '427px',
            textAlign: 'center',
            borderRadius: '0',
            color: '#000'
        }
    },
    title: {
        fontSize: '1.25rem',
        padding: '2.625rem 2.0625rem 0 2rem'
    },
    gifCon: {
        padding: '2.75rem 10.375rem 1.6875rem !important',
        '@media(max-width: 501px)': {
            padding: '1rem 2rem !important'
        }
    },
    gif: {
        width: '8.75rem',
        height: '8.6875rem'
    },
    statusText: {
        color: '#000',
        fontSize: '1rem',
        fontWeight: '300px',
        lineHeight: '30px',
        '@media(max-width: 501px)': {
            fontSize: '0.85rem'
        }
    },
    copyBtn: {
        marginTop: '-3px'
    },
    modalBtn: {
        marginTop: '1rem',
        border: '1px solid #000',
        color: '#000',
        background: 'transparent',
        '&:hover': {
            border: '1px solid #fff',
            color: '#fff',
            background: '#000'
        }
    },
    hashLink: {
        textDecoration: 'none',
        color: '#2F80ED'
    }

});

export default useStyles;
