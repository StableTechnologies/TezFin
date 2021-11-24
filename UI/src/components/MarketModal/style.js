import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
  root: {
    "& .MuiDialog-paper": {
      maxWidth: '472px',
      maxHeight: '700px',
      textAlign: 'center',
      borderRadius: '0',
      color: '#000',
    },
    "& .MuiDialogTitle-root": {
      padding: '1.625rem 1rem 1.2rem',
    },
    "& .MuiDialogContent-root": {
      overflow: 'hidden',
      padding: '0 2.5rem .5rem 1.875rem',
      '@media(min-width: 1024px)': {
        // padding: '0',
      }
    },
    "& .MuiDialogContentText-root": {
      fontWeight: '300',
      fontSize: '1rem',
      lineHeight: '1.875rem',
      letterSpacing: '0.05em',
      '@media(min-width: 1024px)': {
        margin: '1.25rem 3.125rem',
        padding: '0',
      }
    },
    "& .MuiDialogActions-root": {
      padding: '0',
      margin: '2.3125rem 2.875rem 1.625rem',
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: '0',
    },
    '& .MuiButton-text': {
      textTransform: 'none',
    },
    '& .Mui-disabled' :{
      opacity: '0.5',
      color: '#fff',
    }
  },

  '@media(min-width: 1024px)': {
    padding0: {
      // padding: '0 !important',
    },
  },
  img: {
    width: '1.5rem',
    height: '1.5rem',
    margin: '0 .5rem -.4rem 0'
  },
  imgTitle: {
    display: 'inline-block',
  },
  tezImg: {
    width: '5rem',
    height: '5rem',
  '@media(max-width: 501px)': {
    width: '3rem',
    height: '3rem',
  }
  },
  apyRate: {
    padding: '2.25rem 2.5rem 2.25rem 1.875rem !important',
    border: '2px solid #E0E0E0',
    textAlign: "left",
    marginBottom: '2.25rem',
  },
  limit: {
    marginBottom: '23px',
  },
  btnMain: {
    borderRadius: '.5rem',
    width: '380px',
    height: '48px',
    fontSize: '1.25rem',
    fontWeight: '500',
    lineHeight: '1.875rem',
    textTransform: 'unset',
  },
  whiteSpace: {
    whiteSpace: 'nowrap',
    textAlign: 'end'
  },
  close: {
    position: 'absolute',
    top: '1rem',
    right: '0.8125rem',
    width: '1.5rem',
    height: '1.5rem',
    "&:hover": {
      background: 'transparent',
    }
  },
  closeBtn: {
    width: '1.5rem',
    height: '1.5rem',
  },
  faintFont: {
    color: '#828282',
  },
  visibility: {
    visibility: 'hidden',
  },
  formFieldCon: {
    // padding: '66px 143px 85px !important',
    padding: '66px 0px 85px !important',
  },
  form: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    paddingRight: '51px',
    paddingLeft: '143px',
  },
  textField: {
    height: '3.5rem',
    width: '186px',
    // padding: '122px 143px 0',
    // top: '122px',
  },
  inputText: {
    color: '#000',
    fontSize: '40px',
    fontWeight: 300,
    textAlign: 'center',
    lineHeight: '60px',
    letterSpacing: '0.01em',
    height: '3.5rem',
    padding: '0',
    boxSizing: 'border-box',
    '&::placeholder': {
    color: '#BDBDBD',
    }
  },
  inputBtn: {
    fontSize: '1rem',
    fontWeight: 600,
    lineHeight: '1.875rem',
    letterSpacing: '0.005em',
    textAlign: 'left',
    color: '#4F4F4F',
    "&:hover": {
      color: '#3391F6',
      background: 'transparent',
    }
  }
})