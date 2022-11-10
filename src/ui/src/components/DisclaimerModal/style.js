/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

// full screen : 500px+
// mid screen : 390px+
// sm screen : 350px-

export const useStyles = makeStyles({
    root: {
        '& .MuiDialog-paper': {
            maxWidth: '472px',
            minHeight: 'auto',
            textAlign: 'left',
            borderRadius: '0',
            background: '#FFFFFF',
            color: '#000',
            padding: '1rem 1.5rem 1.5rem !important',
        },
        '& .MuiDialogContent-root': {
            padding: '0.75rem 0rem 0.75rem !important',
        },
        '& .MuiDialogContentText-root': {
            textAlign: 'justify',
        },
    },
    btnCon: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0px 0px 0px !important',
    },
    btnMain: {
        backgroundColor: '#39E4B8',
        color: '#fff',
        borderRadius: '.5rem',
        width: '380px',
        height: '48px',
        fontSize: '1.25rem',
        fontWeight: '500',
        lineHeight: '1.875rem',
        textTransform: 'none',
        '&:hover': {
            backgroundColor: '#30D3AA',
        },
        '@media(max-width:390px)': {
            fontSize: '0.925rem',
        },
        '@media(min-width:500px)': {
            fontSize: '1.5rem',
        },
    },
    headerCon: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0px 0px 0px !important',
        gap: '1rem',
    },
    title: {
        fontSize: '1.25rem',
        color: '#000',
        opacity: '0.87',
        '@media(max-width:390px)': {
            fontSize: '0.925rem',
        },
        '@media(min-width:500px)': {
            fontSize: '1.5rem',
        },
    },
    warningIcon: {
        height: '1.25rem',
        width: '1.25rem',
        '@media(max-width:390px)': {
            height: '0.925rem',
            width: '0.925rem',
        },
        '@media(min-width:500px)': {
            height: '1.5rem',
            width: '1.5rem',
        },
    },
});
