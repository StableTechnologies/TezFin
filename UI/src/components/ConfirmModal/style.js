import { makeStyles } from '@mui/styles';

const useStyles = makeStyles({
  root: {
    "& .MuiDialog-paper": {
      width: '472px',
      height: '427px',
      textAlign: 'center',
      borderRadius: '0',
      color: '#000',
    },
  },
  title: {
    fontSize: '1.25rem',
    padding: '2.625rem 2.0625rem 0 2rem'
  },
  gifCon: {
    padding: '2.75rem 10.375rem 1.6875rem !important'
  },
  gif: {
    width: '8.75rem',
    height: '8.6875rem',
    // margin: '0 auto'
  },

})

export default useStyles;