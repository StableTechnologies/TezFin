import { styled } from '@mui/material/styles';

import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  // title: {
  //   backgroundColor: 'green',
  //   // color: (props) => props.color,
  // },
  link: {
    textDecoration: 'none',
    fontWeight: '300',
    fontSize: '1rem',
    lineHeight: '1.875',
    letterSpacing: '0.005em',
    padding: '1.25rem 1rem',
    color: '#000',
    "&:hover": {
      textDecoration: "underline"
  },
    "&:active": {
      textDecoration: "underline"
  },

    // color: (props) => props.color,
  },
  tezHeader: {
    paddingLeft: '2.6875rem',
    paddingTop: '1.625rem',
  },
  linkCon: {
    paddingTop: '2.25rem',
  },
  netAPY: {
    fontWeight: '500',
    fontSize: '1.25rem',
    lineHeight: '1.875rem',
    color: '#191919',
    padding: '2.6875rem 6.25rem 1.5rem',
  },
  questionCircle: {
    marginTop: '-4px'
  },
  padding100: {
    paddingLeft: '6.25rem',
  },
  padding30: {
    paddingLeft: '1.875rem',
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
    }
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

