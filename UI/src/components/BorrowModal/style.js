import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  root: {
    "& .MuiLinearProgress-bar": {
      background: 'linear-gradient(90deg, #39E4B8 65.26%, rgba(233, 238, 8, 0.99) 79.48%)',
    },
  },

  btnSub: {
    background: '#9B51E0',
    color: '#fff',
    "&:hover": {
      background: '#9B51E0',
    }
  },

  inkBarStyle: {
    backgroundColor: '#9B51E0',
  },
})