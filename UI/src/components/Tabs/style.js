import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  root: {
    "& .MuiTabs-scroller": {
      width: '100%'
    },
    "& .MuiTabs-flexContainer": {
      borderBottom: '2px solid #E0E0E0'
    },
    "& .MuiButtonBase-root-MuiTab-root": {
      // width: '50%',
    },
    "& .MuiButtonBase-root.Mui-selected": {
      color: '#000'
    },
    "& .MuiButtonBase-root": {
      width: '50%',
      color: '#BDBDBD',
      textTransform: 'none',
      fontSize: '1rem',
    },
  },
})