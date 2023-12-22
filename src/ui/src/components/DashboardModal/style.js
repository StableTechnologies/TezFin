/* eslint-disable import/prefer-default-export */
import { makeStyles } from "@mui/styles";

export const useStyles = makeStyles({
  root: {
    "& .MuiDialog-paper": {
      maxWidth: "472px",
      textAlign: "center",
      borderRadius: "0",
      color: "#000",
      height: "auto",
      maxHeight: "calc(100% - 1rem)",
      overflow: "auto",
      "@media(min-width: 900px)": {
        maxHeight: "calc(100% - 2.5rem)",
      },
      "@media(max-width: 501px)": {
        minWidth: "90%",
      },
    },
    "& .MuiDialogTitle-root": {
      padding: "1.625rem 2.5rem 0",
      "@media(max-width: 501px)": {
        paddingTop: "1.4rem",
      },
    },
    "& .MuiDialogActions-root": {
      padding: "2.75rem 2.875rem",
      "@media(max-width: 768px)": {
        padding: "1.875rem 2.875rem",
      },
      "@media(max-width: 501px)": {
        padding: "1.875rem 2rem 1.4rem",
      },
      "@media(max-width: 320px)": {
        paddingLeft: "1rem",
        paddingRight: "1rem",
      },
    },
    "& .MuiOutlinedInput-notchedOutline": {
      border: "0",
    },
    "& .MuiButton-text": {
      textTransform: "none",
    },
    "& .Mui-disabled": {
      opacity: "0.5",
      color: "#fff",
    },
  },
  img: {
    width: "1.5rem",
    height: "1.5rem",
    margin: "0 .5rem -.3rem 0",
    "@media(max-width: 501px)": {
      width: "1rem",
      height: "1rem",
      margin: "0 4px -3px 0",
    },
  },
  imgTitle: {
    display: "inline-block",
  },
  fTokenImgCon: {
    marginTop: "1rem",
    overflow: "visible !important",
  },
  fTokenImg: {
    width: "5rem",
    height: "5rem",
    "@media(max-width: 501px)": {
      width: "3rem",
      height: "3rem",
    },
  },
  headerText: {
    fontWeight: "300",
    fontSize: "1rem",
    lineHeight: "1.875rem",
    letterSpacing: "0.05em",
    textAlign: "justify",
    color: "#000",
    opacity: "0.6",
    "@media(min-width: 1024px)": {
      margin: "1.25rem 3.125rem",
      padding: "0",
    },
    "@media(max-width: 500px)": {
      fontSize: ".875rem",
    },
  },
  contentBoxOne: {
    padding: "1.5625rem 2.5rem !important",
    borderTop: "2px solid #E0E0E0",
    borderBottom: "2px solid #E0E0E0",
    textAlign: "left",
    "@media(max-width: 1200px)": {
      padding: "1rem 2.5rem !important",
    },
    "@media(max-width: 768px)": {
      padding: "1.25rem 2.5rem !important",
    },
    "@media(max-width: 501px)": {
      padding: "1.25rem 2rem !important",
      borderTop: "1px solid #E0E0E0",
      borderBottom: "1px solid #E0E0E0",
    },
  },
  contentBoxTwo: {
    padding: "0 2.5rem .5rem",
    "@media(max-width: 501px)": {
      padding: "0 2rem ",
    },
  },
  limit: {
    paddingTop: "1.875rem !important",
    paddingBottom: "1.25rem !important",
  },
  limitUsed: {
    paddingBottom: "1.25rem !important",
  },
  progressBarCon: {
    paddingBottom: "0 !important",
    minHeight: "8px",
  },
  btnMain: {
    borderRadius: ".5rem",
    width: "380px",
    height: "48px",
    fontSize: "1.25rem",
    fontWeight: "500",
    lineHeight: "1.875rem",
    textTransform: "unset",
    "@media(max-width: 501px)": {
      width: "100%",
    },
  },
  modalTextRight: {
    whiteSpace: "nowrap",
    textAlign: "end",
  },
  close: {
    position: "absolute",
    top: "1rem",
    right: "0.8125rem",
    width: "1.5rem",
    height: "1.5rem",
    "&:hover": {
      background: "transparent",
    },
  },
  closeBtn: {
    width: "1.5rem",
    height: "1.5rem",
  },
  faintFont: {
    color: "#000",
    opacity: "0.6",
  },
  modalText: {
    color: "#000",
    opacity: "0.87",
    fontSize: "1.25rem",
    fontWeight: "300",
    lineHeight: "30px",
    "@media(max-width: 501px)": {
      fontSize: "0.875rem",
    },
    "@media(max-width: 320px)": {
      fontSize: "0.75rem",
    },
  },
  visibility: {
    visibility: "hidden",
  },
  formFieldCon: {
    padding: "51px 0px 47px !important",
    "@media(max-width: 768px)": {
      padding: "35px 0px !important",
    },
    "@media(max-width: 501px)": {
      padding: "0 0px 1.25rem !important",
    },
  },
  form: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-evenly",
    paddingRight: "51px",
    paddingLeft: "127px",
    "@media(max-width: 501px)": {
      padding: "1rem",
      justifyContent: "start",
    },
  },
  textField: {
    height: "3.5rem",
    width: "186px",

    "@media(max-width: 501px)": {
      marginLeft: "16%",
    },
    "@media(max-width: 320px)": {
      width: "145px",
    },
  },
  inputText: {
    color: "#000",
    opacity: "0.87",
    fontSize: "40px",
    fontWeight: 300,
    textAlign: "center",
    lineHeight: "60px",
    letterSpacing: "0.01em",
    height: "3.5rem",
    padding: "0",
    boxSizing: "border-box",
    "&::placeholder": {
      color: "#000",
      opacity: "0,6",
    },
    "@media(max-width: 501px)": {
      fontSize: "2rem",
    },
  },

  tabBox: {
    "@media(max-width: 501px)": {
      marginRight: "-20px",
      marginLeft: "-20px",
      width: "calc(100% + 40px)",
    },
  },
  inputBtn: {
    fontSize: "1rem",
    fontWeight: "300",
    lineHeight: "1.875rem",
    letterSpacing: "0.005em",
    textAlign: "left",
    color: "#4F4F4F",
    "&:hover": {
      color: "#3391F6",
      background: "transparent",
    },
    "&:disabled": {
      color: "#4F4F4F",
    },
    "@media(max-width: 501px)": {
      fontSize: "0.78rem",
      paddingLeft: "5px",
      marginRight: "0px",
    },
    "@media(max-width: 320px)": {
      fontSize: "0.7rem",
    },
  },
  warningText: {
    marginTop: "0.5625rem",
    color: "#000",
    opacity: "0.87",
    textAlign: "justify",
    fontWeight: "300",
    fontSize: "1rem",
    lineHeight: "1.5rem",
    letterSpacing: "0.005em",
    "@media(max-width: 501px)": {
      fontSize: "0.875rem",
    },
    "@media(max-width: 320px)": {
      fontSize: "0.75rem",
    },
  },
  margin0: {
    margin: "0 !important",
  },
  borderBottom0: {
    borderBottom: "0",
  },
  borderTop0: {
    borderTop: "0",
  },
});
