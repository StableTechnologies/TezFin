import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  root: {
    "& .MuiTabs-indicator": {
      backgroundColor: 'red !important',
    },
  },

  btnSub: {
    background: '#39E4B8',
    color: '#fff',
    "&:hover": {
      background: '#39E4B8',
    }
  },

  inkBarStyle: {
    backgroundColor: '#39E4B8',
  },

})