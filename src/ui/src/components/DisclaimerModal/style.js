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
            color: '#000',
            padding: '0.5rem 0rem 2rem'
        },
        '& .MuiDialogTitle-root': {
            justifyContent: 'center',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: '700',
            fontSize: '20px',
            lineHeight: '30px',
            color: '#000',
            padding: '1.925rem 0.9rem 0rem'
        },
        '& .MuiDialogContent-root': {
            padding: '1rem 2rem 2.5rem'
        },
        '& .MuiDialogContentText-root': {
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: '400',
            fontSize: '16px',
            lineHeight: '24px',
            textAlign: 'justify',
            color: '#000',
            opacity: '0.87',
            padding: '1.35rem 1.5rem 0rem',
            '@media(max-width: 501px)': {
                fontSize: '0.875rem'
            }
        },
        '& .MuiDialogActions-root': {
            padding: '1.75rem 2.875rem',
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
        }
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
            width: '100%',
            fontSize: '1rem'
        }
    },
    headerCon: {
        display: 'flex',

        marginRight: '1.5rem',
        '@media(max-width: 501px)': {
            padding: '0.925rem 2rem '
        },
        '@media(max-width: 320px)': {
            padding: '0.925rem .5rem '
        }
    },
    title: {
        fontSize: '1.3rem',
        color: '#000',
        padding: '0.1rem 0rem 0rem',
        opacity: '0.87',
        '@media(max-width: 501px)': {
            fontSize: '1rem'
        }
    },
    warningCon: {
        marginRight: '1rem',
        padding: '0.2rem 0rem 0rem'
    },
    warningIcon: {
        width: '1rem',
        height: '1rem',
        '@media(max-width: 501px)': {
            width: '1.25rem',
            height: '1.25rem'
        }
    }
});
