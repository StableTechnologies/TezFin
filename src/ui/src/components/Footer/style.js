import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  root: {
    "& .MuiTypography-root": {
      '@media(min-width: 968px)': {
        fontSize: '0.875rem',
      },
      '@media(max-width: 768px)': {
        fontSize: '0.75rem',
      },
    },
    '& .MuiIconButton-root': {
      padding: '0',
      '&:hover': {
        background: 'transparent',
      },
    },
  },
  footerCon: {
    height: '3.1875rem',
    paddingTop: '1.25rem',
    paddingLeft: '2.6875rem',
    paddingRight: '2.5rem',
    fontSize: '1rem',
    fontWeight: '300',
    lineHeight: '1.875rem',
    letterSpacing: '0.005em',
    borderTop: '1px solid rgba(0, 0, 0, 0.45)',
    '@media(max-width: 501px)': {
      paddingLeft: '1.5rem'
    },
    '@media(max-width: 768px)': {
      paddingRight: '1rem',
    }
  },
  footerLink: {
    color: '#000',
    fontSize: '1rem',
    fontWeight: '300',
    lineHeight: '1.875rem',
    letterSpacing: '0.005em',
    textAlign: 'left',
    textDecoration: 'none',
    marginLeft: '2.0625rem',
    '@media(min-width: 968px)': {
      fontSize: '0.875rem',
    },
    '@media(max-width: 768px)': {
      fontSize: '0.75rem',
    },
    '@media(max-width: 501px)': {
      marginLeft: '1.25rem',
    }
  },
  activeLink: {
    borderBottom: '1px solid #000'
  },
  icon: {
    width: '1.25rem',
    height: '1.25rem',
    marginLeft: '1.6875rem'
  },
});