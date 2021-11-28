import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  root: {
    "& .MuiTypography-root": {
      '@media(max-width: 501px)': {
        fontSize: '0.75rem',
      },
      '@media(max-width: 320px)': {
        fontSize: '0.625rem',
      },
    },
    "& .MuiTableCell-root": {
      borderBottom: '1px solid #E0E0E0',
      padding: '.5rem',
      '@media(min-width: 1200px)': {
        paddingLeft: '1.5rem',
      },
      '@media(max-width: 501px)': {
        padding: '.5rem',
      },
    },
     "& .MuiTableHead-root ": {
      "& .MuiTableCell-root": {
          color: '#BDBDBD',
          fontSize: '.875rem',
          '@media(min-width: 768px)': {
            minWidth: '5.5625rem',
          },
          '@media(max-width: 320px)': {
            fontSize: '0.75rem',
          },
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
          '@media(min-width: 501px)': {
            fontSize: '1rem',
          },
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
    width: '2rem',
    height: '2rem',
    marginBottom: '-10px',
    '@media (min-width: 769px) and (max-width: 1024px)': {
      width: '1.5rem',
      height: '1.5rem',
      marginBottom: '-6px',
      fontSize: '0.75rem',
    },
    '@media(max-width: 501px)': {
      width: '1rem',
      height: '1rem',
      marginBottom: '-4px',
      fontSize: '0.75rem',
    },
  },
  faintFont: {
    color: '#828282',
  },
})