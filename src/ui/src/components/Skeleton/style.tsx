import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    root: {
      '& .MuiSkeleton-root': {
          background: '#EAEAEA'
      },
    },
    cellConOne: {
      display: 'flex'
    },
    cellConTwo: {
      display: 'flex',
      justifyContent: 'flex-end'
    },
    cellOneImg: {
      display: 'flex',
      width: '2rem',
      height: '2rem',
    },
    cellText: {
      margin: '0.5rem',
      width: '50%',
      height: '1rem',
    },
});
