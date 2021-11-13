import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  dashboard: {
    background: '#fff',
    padding: '0px 6.25rem 10.125rem',
    '@media(max-width: 768px)': {
     padding: '0px 4rem 10.125rem',
   },
    '@media(max-width: 501px)': {
     padding: '0px 1.875rem 10.125rem',
   }
  },
   '@media(min-width: 1024px)': {
      paddingLeft: {
        paddingLeft: '1.875rem'
      },
      paddingRight: {
        paddingRight: '1.875rem'
      },
    },
    tableTitle: {
      padding: ' 1.5rem 0 .5rem',
      fontSize: '1.25rem',
      fontWeight: '500',
      lineHeight: '30px',
    },
    tableTitleTwo: {
      color: '#BDBDBD',
      padding: ' 36px 0 .5rem 8px',
      fontSize: '0.875rem',
      fontWeight: '500',
      lineHeight: '26px',
      letterSpacing: '0.05em'
    }
})