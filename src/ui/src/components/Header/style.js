import { styled } from '@mui/material/styles';

import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    tezHeader: {
        paddingLeft: '2.6875rem',
        paddingTop: '1.625rem',
        '@media(max-width: 1024px)': {
            width: '18.75rem'
        },
        '@media(max-width: 768px)': {
            width: '10rem',
            paddingTop: '2.25rem'
        },
        '@media(max-width: 501px)': {
            paddingLeft: '1.5rem'
        }
    },
    linkCon: {
        paddingTop: '2.25rem',
        '@media(min-width: 1200px)': {
            textAlign: 'end'
        }
    },
    link: {
        textDecoration: 'none',
        fontWeight: '300',
        fontSize: '1rem',
        lineHeight: '1.875',
        letterSpacing: '0.005em',
        color: '#000',
        '@media(min-width: 501px)': {
            '&:hover': {
                borderBottom: '1px solid #000'
            }
        }
    },
    activeLink: {
        borderBottom: '1px solid #000'
    },
    netAPY: {
        fontWeight: '500',
        fontSize: '1.25rem',
        lineHeight: '1.875rem',
        color: '#191919',
        padding: '2.6875rem 6.25rem 1.5rem',
        '@media(max-width: 1024px)': {
            paddingLeft: '4rem'
        },
        '@media(max-width: 768px)': {
            padding: '2.6875rem 4rem 1.5rem'
        },
        '@media(max-width: 501px)': {
            padding: '2.6875rem 1.875rem 1.5rem'
        }
    },
    questionCircle: {
        marginTop: '-4px'
    },
    padding100: {
        paddingLeft: '6.25rem',
        '@media(max-width: 1024px)': {
            paddingLeft: '4rem'
        },
        '@media(max-width: 768px)': {
            paddingLeft: '4rem'
        },
        '@media(max-width: 501px)': {
            paddingLeft: '1.875rem'
        }
    },
    padding30: {
        paddingLeft: '1.875rem',
        '@media(max-width: 768px)': {
            paddingLeft: '4rem',
            paddingTop: '1.5rem',
        },
        '@media(max-width: 501px)': {
            paddingLeft: '1.875rem'
        }
    },
    compositionTitle:{
      fontSize: '1.25rem',
      fontWeight: '500',
      lineHeight: '30px'
    },
    boxOne: {
        borderRight: '1px solid #BDBDBD',
        minWidth: 'fit-content',
        maxWidth: 'fit-content',
        paddingRight: '2rem',
        '@media(min-width: 769px) and (max-width: 1200px)': {
          paddingRight: '1rem',
        },
    },
    boxTwo: {
      '@media(min-width: 501px)': {
          minWidth: 'fit-content',
          maxWidth: 'fit-content',
        },
        '@media(min-width: 1201px)': {
          paddingLeft: '54px',
        },
        '@media(min-width: 501px) and (max-width: 1200px)': {
          paddingLeft: '27px',
        },
    },
    statsTitle: {
        color: '#BDBDBD',
        fontSize: '14px',
        lineHeight: '26px'
    },
    statsValue: {
        fontSize: '1.25rem',
        lineHeight: '30px',
        color: '#000',
        '@media(max-width: 1200px)': {
          fontSize: '1.125rem',
        },
        '@media(max-width: 768px)': {
          fontSize: '1rem',
        },
    },
    progressBar: {
        width: '33rem',
        paddingTop: '7px',
        '@media(max-width: 1024px)': {
            width: '23.75rem'
        },
        '@media(max-width: 768px)': {
            width: '75%'
        }
    },
    box: {
        paddingTop: '55px',
    },
    addWalletCon: {
        paddingTop: '2.25rem',
        paddingRight: '2.5rem',
        textAlign: 'end',
        '@media(max-width: 768px)': {
            paddingRight: '1rem'
        }
    },
    wallet: {
        minWidth: '10.75rem',
        height: '1.875rem',
        background: 'transparent',
        fontSize: '1rem',
        fontWeight: '400',
        lineHeight: '2.25rem',
        textTransform: 'none',
        borderRadius: '.5rem'
    },
    defaultWallet: {
        border: '2px solid #2F80ED',
        color: '#2F80ED',
        '&:hover': {
            background: '#2F80ED',
            color: '#fff'
        }
    },
    connectedWallet: {
        border: '.5px solid #828282',
        color: '#000',
        '&:hover': {
            background: 'transparent'
        }
    },
    hamburgerCon: {
        position: 'absolute',
        top: '0.8125rem',
        right: '1rem',
        width: '1.5rem',
        height: '1.5rem',
        '&:hover': {
            background: 'transparent'
        }
    },
    hamburger: {
        width: '1.5rem',
        height: '1.5rem'
    },
    nav: {
        '@media(max-width: 501px)': {
            display: 'none'
        }
    },
    mobileNav: {
        display: 'none',
        '@media(max-width: 501px)': {
            display: 'block'
        }
    }
});

const PREFIX = 'Header';
export const classes1 = {
    root: `${PREFIX}-root`,
    cta: `${PREFIX}-cta`,
    content: `${PREFIX}-content`
};
export const HeaderCon = styled('div')(({ theme }) => ({
    [`&.${classes1.root}`]: {
        backgroundColor: '#F9FAFC',
        paddingBottom: '3.0625rem',
        '@media(min-width: 1024px)': {
            height: '391px'
        }
    }
}));
export const Title = styled('p')(({ theme }) => ({
    [`&.${classes1.content}`]: {
        color: '#000',
        fontSize: '52px',
        fontWeight: 'bold',
        lineHeight: '70px',
        letterSpacing: '0.005em',
        maxWidth: '159px'
    }
}));
