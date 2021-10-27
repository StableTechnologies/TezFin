import { styled } from '@mui/material/styles';

import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  // title: {
  //   backgroundColor: 'green',
  //   // color: (props) => props.color,
  // },
  tezHeader: {
    paddingLeft: '2.6875rem',
    paddingTop: '1.625rem',
    '@media(max-width: 1024px)': {
      width: '18.75rem',
    },
    '@media(max-width: 768px)': {
      // width: '12.5rem',
      width: '10rem',
      paddingTop: '2.25rem',
    },
    '@media(max-width: 501px)': {
      paddingLeft: '1.5rem',
    },
  },
  linkCon: {
    paddingTop: '2.25rem',
    '@media(min-width: 1200px)': {
      textAlign: 'end',
    },
  },
  link: {
    textDecoration: 'none',
    fontWeight: '300',
    fontSize: '1rem',
    lineHeight: '1.875',
    letterSpacing: '0.005em',
    // padding: '1.25rem 1rem',
    color: '#000',
    "&:hover": {
      borderBottom: '1px solid #000'
    },
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
    '@media(max-width: 768px)': {
      padding: '2.6875rem 4rem 1.5rem',
    },
    '@media(max-width: 501px)': {
      padding: '2.6875rem 1.875rem 1.5rem',
    },
  },
  questionCircle: {
    marginTop: '-4px'
  },
  padding100: {
    paddingLeft: '6.25rem',
    '@media(max-width: 768px)': {
    paddingLeft: '4rem',
    },
    '@media(max-width: 501px)': {
    paddingLeft: '1.875rem',
    },
  },
  padding30: {
    paddingLeft: '1.875rem',
    '@media(max-width: 768px)': {
      // paddingLeft: '6.255rem',
      paddingLeft: '4rem',
      },
    '@media(max-width: 501px)': {
      paddingLeft: '1.875rem',
      },
  },
  borderRight: {
    borderRight: '1px solid #BDBDBD',
  },
  statsTitle: {
    color: '#BDBDBD',
    fontSize: '14px',
    lineHeight: '26px'
  },
  statsValue: {
    fontSize: '20px',
    lineHeight: '30px',
    color: '#000',
  },
  progressBar: {
    width: '75%',
    paddingTop: '7px',
    '@media(max-width: 1024px)': {
      width: '100%',
    },
    '@media(max-width: 768px)': {
      width: '75%',
    }
  },
  box: {
    paddingTop: '55px',
    paddingBottom: '25px',
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
    borderRadius: '.5rem',
  },
  defaultWallet: {
    border:'2px solid #2F80ED',
    color: '#2F80ED',
    '&:hover': {
      background: '#2F80ED',
      color: '#fff',
    },
  },
  connectedWallet: {
    border:'.5px solid #828282',
    color: '#000',
    '&:hover': {
      background: 'transparent',
    },
  }
});

const PREFIX = 'Header';
export const classes1 = {
  root: `${PREFIX}-root`,
  // title: `${PREFIX}-title`,
  cta: `${PREFIX}-cta`,
  content: `${PREFIX}-content`,
}
export const HeaderCon = styled('div')(({ theme }) => ({
    [`&.${classes1.root}`]: {
      // backgroundColor: theme.palette.primary.main,
      backgroundColor: '#F9FAFC',
      // padding: '1rem 1.5rem',
      // width: '1544px',
   '@media(min-width: 1024px)': {
      height: '391px'
   }
      // color:'#fff'
    },
  }))
export const Title = styled('p')(({ theme }) => ({
    [`&.${classes1.content}`]: {
      // backgroundColor: 'blue',
      color:'#000',
      fontSize: '52px',
      fontWeight: 'bold',
      lineHeight: '70px',
      letterSpacing: '0.005em',
      maxWidth: '159px',
    },
  }))

