import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  root: {
    "& .MuiTableCell-root": {
      borderBottom: '1px solid #E0E0E0',
    },
     "& .MuiTableHead-root ": {
      "& .MuiTableCell-root": {
          color: '#BDBDBD',
          fontSize: '.875rem',
      },
      "& .MuiTableRow-root": {
          height: '3.5rem',
      },
    },
    "& .MuiTableBody-root ":{
      "& .MuiTableRow-root": {
          height: '4.5rem',
      "&:hover": {
        background: '#DDF5FC66',
      }
      },
      "& .MuiTableCell-root": {
        fontSize: '1rem',
      },
    }

  },
  tableCon: {
    border: '1px solid #E0E0E0',
    borderBottom: '0',
    borderRadius: '1rem',
    // width: '590px'
  },
  img: {
    marginBottom: '-10px',
  }
})