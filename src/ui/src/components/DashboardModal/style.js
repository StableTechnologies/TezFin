/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    root: {
        '& .MuiDialog-paper': {
            maxWidth: '472px',
            textAlign: 'center',
            borderRadius: '0',
            color: '#000'
        },
        '& .MuiDialogTitle-root': {
            padding: '1.625rem 2.5rem 0'
        },
        '& .MuiDialogContent-root': {
            overflow: 'hidden',
            padding: '0 2.5rem .5rem',
            '@media(max-width: 501px)': {
                padding: '0 0.5rem .5rem'
            }
        },
        '& .MuiDialogContentText-root': {
            fontWeight: '300',
            fontSize: '1rem',
            lineHeight: '1.875rem',
            letterSpacing: '0.05em',
            '@media(min-width: 1024px)': {
                margin: '1.25rem 3.125rem',
                padding: '0'
            },
            '@media(max-width: 500px)': {
                fontSize: '.875rem'
            }
        },
        '& .MuiDialogActions-root': {
            padding: '0',
            margin: '2.9375rem 2.875rem 2.75rem',
            '@media(max-width: 768px)': {
                margin: '30px 2.875rem'
            },
            '@media(max-width: 501px)': {
                margin: '1.875rem'
            },
            '@media(max-width: 320px)': {
                marginLeft: '1rem',
                marginRight: '1rem'
            }
        },
        '& .MuiOutlinedInput-notchedOutline': {
            border: '0'
        },
        '& .MuiButton-text': {
            textTransform: 'none'
        },
        '& .Mui-disabled': {
            opacity: '0.5',
            color: '#fff'
        }
    },

    img: {
        width: '1.5rem',
        height: '1.5rem',
        margin: '0 .5rem -.3rem 0'
    },
    imgTitle: {
        display: 'inline-block'
    },
    tezImg: {
        width: '5rem',
        height: '5rem',
        '@media(max-width: 501px)': {
            width: '3rem',
            height: '3rem'
        }
    },
    CurrentState: {
        padding: '1.5625rem 2.5rem !important',
        borderTop: '2px solid #E0E0E0',
        borderBottom: '0',
        textAlign: 'left',
        '@media(max-width: 768px)': {
            padding: '1.25rem 2.5rem !important'
        },
        '@media(max-width: 501px)': {
            padding: '1.25rem 0.5rem !important',
            borderTop: '1px solid #E0E0E0'
        }
    },
    apyRate: {
        padding: '1.5625rem 1.5rem !important',
        borderTop: '2px solid #E0E0E0',
        borderBottom: '2px solid #E0E0E0',
        textAlign: 'left',
        margin: '0 1rem',
        '@media(max-width: 768px)': {
            padding: '1.25rem 1.5rem !important'
        },
        '@media(max-width: 501px)': {
            padding: '1.25rem 0rem !important',
            margin: '0 0.5rem'
        }
    },
    limit: {
        paddingTop: '1.875rem !important',
        paddingBottom: '1.25rem !important'
    },
    limitUsed: {
        paddingBottom: '1.25rem !important'
    },
    progressBarCon: {
        paddingBottom: '0 !important'
    },
    btnMain: {
        borderRadius: '.5rem',
        width: '380px',
        height: '48px',
        fontSize: '1.25rem',
        fontWeight: '500',
        lineHeight: '1.875rem',
        textTransform: 'unset'
    },
    modalTextRight: {
        whiteSpace: 'nowrap',
        textAlign: 'end'
    },
    close: {
        position: 'absolute',
        top: '1rem',
        right: '0.8125rem',
        width: '1.5rem',
        height: '1.5rem',
        '&:hover': {
            background: 'transparent'
        }
    },
    closeBtn: {
        width: '1.5rem',
        height: '1.5rem'
    },
    faintFont: {
        color: '#828282'
    },
    modalText: {
        fontSize: '1.25rem',
        fontWeight: '300',
        lineHeight: '30px',
        '@media(max-width: 501px)': {
            fontSize: '1rem'
        },
        '@media(max-width: 376px)': {
            fontSize: '0.875rem'
        },
        '@media(max-width: 320px)': {
            fontSize: '0.75rem'
        }
    },
    visibility: {
        visibility: 'hidden'
    },
    formFieldCon: {
        padding: '69px 0px 53px !important',
        '@media(max-width: 768px)': {
            padding: '35px 0px !important'
        },
        '@media(max-width: 501px)': {
            padding: '0 0px 1.25rem !important'
        }
    },
    form: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        paddingRight: '51px',
        paddingLeft: '143px',
        '@media(max-width: 501px)': {
            padding: '0 1rem',
            justifyContent: 'start'
        }
    },
    textField: {
        height: '3.5rem',
        width: '186px',
        '@media(max-width: 320px)': {
            width: '145px'
        }
    },
    inputText: {
        color: '#000',
        fontSize: '40px',
        fontWeight: 300,
        textAlign: 'center',
        lineHeight: '60px',
        letterSpacing: '0.01em',
        height: '3.5rem',
        padding: '0',
        boxSizing: 'border-box',
        '&::placeholder': {
            color: '#BDBDBD'
        },
        '@media(max-width: 501px)': {
            fontSize: '2rem'
        }
    },
    inputBtn: {
        fontSize: '1rem',
        fontWeight: '300',
        lineHeight: '1.875rem',
        letterSpacing: '0.005em',
        textAlign: 'left',
        color: '#4F4F4F',
        '&:hover': {
            color: '#3391F6',
            background: 'transparent'
        },
        '&:disabled': {
            color: '#4F4F4F'
        },
        '@media(max-width: 501px)': {
            fontSize: '0.875rem'
        },
        '@media(max-width: 320px)': {
            fontSize: '0.7rem'
        }
    }
});