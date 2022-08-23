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
            padding: '0rem 0rem 2rem'
        },
        '& .MuiDialogTitle-root': {
            justifyContent: 'center',
            fontFamily: 'Poppins',
            fontStyle: 'normal',
            fontWeight: '700',
            fontSize: '20px',
            lineHeight: '30px',
            color: '#000',
            padding: '1.925rem 4rem 0'
        },
        '& .MuiDialogContent-root': {
            padding: '10 2.5rem 2.5rem'
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
            padding: '1.35rem 1.5rem 0',
            '@media(max-width: 501px)': {
                fontSize: '0.875rem'
            }
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
        '@media(max-width: 501px)': {
            padding: '0.925rem 2rem !important'
        },
        '@media(max-width: 320px)': {
            padding: '0.925rem .5rem !important'
        }
    },
    title: {
        fontSize: '1.5rem',
        color: '#000',
        opacity: '0.87',
        '@media(max-width: 501px)': {
            fontSize: '1rem'
        }
    },
    warningCon: {
        marginRight: '1rem'
    },
    warningIcon: {
        width: '2rem',
        height: '2rem',
        '@media(max-width: 501px)': {
            width: '1.25rem',
            height: '1.25rem'
        }
    }
});
