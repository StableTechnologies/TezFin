/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    root: {
        '& .MuiDialog-paper': {
            maxWidth: '472px',
            minHeight: 'auto',
            textAlign: 'left',
            borderRadius: '0',
	    background: '#FFFFFF',
            color: '#000'
        },
        '& .MuiDialogTitle-root': {
	    fontFamily: 'Poppins',
            fontStyle: 'normal', 
            fontWeight: '700',
            fontSize: '20px',
            lineHeight: '30px',
            color: '#000',
            padding: '0.925rem 6.0rem 0'
        },
        '& .MuiDialogContent-root': {
            padding: '10 2.5rem 2.5rem',
        },
        '& .MuiDialogContentText-root': {
	    fontFamily: 'Poppins',
            fontStyle: 'normal', 
            fontWeight: '400',
            fontSize: '16px',
            lineHeight: '24px',
            color: '#000',
            padding: '1.35rem 0rem 0'
        },
        '& .MuiDialogActions-root': {
            padding: '2.75rem 2.875rem',
            '@media(max-width: 768px)': {
                padding: '30px 2.875rem'
            },
            '@media(max-width: 501px)': {
                padding: '1.875rem'
            },
            '@media(max-width: 320px)': {
                paddingLeft: '1rem',
                paddingRight: '1rem'
            }
        },
        '& .MuiOutlinedInput-notchedOutline': {
            border: '0'
        },
        '& .MuiButton-text': {
            textTransform: 'none'
        },
    },
    btnMain: {
        background: '#39E4B8',
        color: '#fff',
        '&:hover': {
            background: '#30D3AA'
        },
        borderRadius: '.5rem',
        width: '380px',
        height: '48px',
        fontSize: '1.25rem',
        fontWeight: '500',
        lineHeight: '1.875rem',
        textTransform: 'unset',
        '@media(max-width: 501px)': {
            width: '100%'
        }
    }
});
