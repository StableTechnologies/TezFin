import { styled } from "@mui/material/styles";

import { makeStyles } from "@mui/styles";

export const useStyles = makeStyles({
  root: {
    "& .MuiPopover-paper": {
      width: "382px",
      maxHeight: "202px",
      borderRadius: "4px",
      background: "#fff",
      marginTop: "0.5rem",
      padding: "1rem 0.5rem",
      overflow: "hidden",
    },
  },
  navCon: {
    backgroundColor: "#F9FAFC",
  },
  tezHeaderCon: {
    paddingLeft: "2.6875rem",
    paddingTop: "1.625rem",
    "@media(max-width: 501px)": {
      paddingLeft: "0.5rem",
    },
  },
  tezHeader: {
    width: "max-content",
    height: "3.142rem",
    "@media(max-width: 768px)": {
      width: "10rem",
    },
    "@media(max-width: 501px)": {
      width: "8rem",
      height: "2.642rem",
    },
  },
  linkCon: {
    paddingTop: "2.25rem",
    "@media(min-width: 1200px)": {
      textAlign: "end",
    },
  },
  link: {
    textDecoration: "none",
    fontWeight: "300",
    fontSize: "1rem",
    lineHeight: "1.875",
    letterSpacing: "0.005em",
    color: "#000",
    opacity: "0.87",
    "@media(min-width: 501px)": {
      "&:hover": {
        borderBottom: "1px solid #000",
      },
    },
  },
  activeLink: {
    borderBottom: "1px solid #000",
  },
  netAPY: {
    padding: "2.6875rem 6.25rem 1.5rem",
    "@media(max-width: 1024px)": {
      paddingLeft: "4rem",
    },
    "@media(max-width: 900px)": {
      paddingLeft: "2rem",
    },
    "@media(max-width: 768px)": {
      padding: "2.6875rem 4rem 1.5rem",
    },
    "@media(max-width: 501px)": {
      padding: "2.6875rem 1rem 1.5rem",
    },
  },
  netAPYText: {
    fontWeight: "500",
    fontSize: "1.25rem",
    lineHeight: "1.875rem",
    color: "#191919",
  },
  netAPYImg: {
    width: "1rem",
    height: "1rem",
  },
  compositionOne: {
    paddingLeft: "6.25rem",
    "@media(max-width: 1024px)": {
      paddingLeft: "4rem",
    },
    "@media(max-width: 900px)": {
      paddingLeft: "2rem",
    },
    "@media(max-width: 768px)": {
      paddingLeft: "4rem",
    },
    "@media(max-width: 501px)": {
      paddingLeft: "1rem",
    },
  },
  compositionTwo: {
    paddingLeft: "1.875rem",
    "@media(max-width: 1024px)": {
      paddingLeft: "0.9375rem",
    },
    "@media(max-width: 900px)": {
      paddingLeft: "2rem",
    },
    "@media(max-width: 899px)": {
      paddingLeft: "2rem",
      paddingTop: "1.5rem",
    },
    "@media(max-width: 768px)": {
      paddingLeft: "4rem",
      paddingTop: "1.5rem",
    },
    "@media(max-width: 501px)": {
      paddingLeft: "1rem",
    },
  },
  compositionTitle: {
    color: "#000",
    opacity: "0.87",
    fontSize: "1.25rem",
    fontWeight: "500",
    lineHeight: "30px",
  },
  compositionGrid: {
    justifyContent: "space-between",
    rowGap: "5.6rem",

    "@media(max-width: 768px)": {
      rowGap: "4.5rem",
    },
  },
  box: {
    paddingTop: "3.7375rem",
    "@media(max-width: 768px)": {
      paddingTop: "3rem",
    },
  },
  boxOne: {
    borderRight: "1px solid #BDBDBD",
    minWidth: "fit-content",
    maxWidth: "fit-content",
    paddingRight: "2rem",
    "@media(min-width: 769px) and (max-width: 1200px)": {
      paddingRight: "1rem",
    },
    "@media(max-width: 900px)": {
      maxWidth: "25%",
    },
    "@media(max-width: 768px)": {
      maxWidth: "28%",
    },
    "@media(max-width: 501px)": {
      paddingRight: "1rem",
      marginRight: "1rem",
      minWidth: "170px",
    },
    "@media(max-width: 320px)": {
      paddingRight: "0.5rem",
      marginRight: "0.5rem",
      minWidth: "135px",
    },
  },
  boxTwo: {
    "@media(min-width: 501px)": {
      minWidth: "fit-content",
      maxWidth: "fit-content",
    },
    "@media(min-width: 1201px)": {
      paddingLeft: "54px",
    },
    "@media(min-width: 501px) and (max-width: 1200px)": {
      paddingLeft: "27px",
    },
    "@media(max-width: 501px)": {
      paddingLeft: "0",
      flexWrap: "nowrap",
    },
  },
  boxImg: {
    width: "3.5rem",
    height: "3.5rem",
    "@media(max-width: 320px)": {
      width: "2rem",
      height: "2rem",
    },
  },
  statsTitle: {
    color: "#000",
    opacity: "0.6",
    fontSize: "0.875rem",
    lineHeight: "26px",
    "@media(max-width: 376px)": {
      fontSize: "0.75rem",
    },
    "@media(max-width: 320px)": {
      lineHeight: "13px",
    },
  },
  statsValue: {
    fontSize: "1.25rem",
    lineHeight: "30px",
    color: "#000",
    opacity: "0.87",
    "@media(max-width: 1200px)": {
      fontSize: "1.125rem",
    },
    "@media(max-width: 768px)": {
      fontSize: "1rem",
    },
    "@media(max-width: 501px)": {
      fontSize: "0.875rem",
    },
    "@media(max-width: 320px)": {
      fontSize: "0.75rem",
    },
  },
  progressBar: {
    width: "33rem",
    paddingTop: "7px",
    "@media(min-width: 1441px)": {
      width: "85%",
    },
    "@media(max-width: 1280px)": {
      width: "80%",
    },
    "@media(max-width: 1024px)": {
      width: "85%",
    },
    "@media(max-width: 900px)": {
      width: "95%",
    },
    "@media(max-width: 768px)": {
      width: "95%",
    },
    "@media(max-width: 501px)": {
      width: "95%",
    },
    "@media(max-width: 376px)": {
      width: "95%",
    },
  },
  addWalletCon: {
    paddingTop: "2.1875rem",
    paddingRight: "2.5rem",
    textAlign: "end",
    "@media(max-width: 768px)": {
      paddingTop: "1.625rem",
    },
    "@media(max-width: 501px)": {
      paddingRight: "0.5rem",
    },
  },
  wallet: {
    width: "10.75rem",
    height: "2rem",
    background: "transparent",
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "2rem",
    textTransform: "none",
    borderRadius: ".5rem",
    "@media(max-width: 501px)": {
      width: "8.25rem",
      lineHeight: "1.9rem",
      fontSize: ".875rem",
    },
    "@media(max-width: 320px)": {
      width: "7.5rem",
      fontSize: ".75rem",
    },
  },
  defaultWallet: {
    border: "2px solid #2F80ED",
    color: "#2F80ED",
    "&:hover": {
      background: "#2F80ED",
      color: "#fff",
    },
  },
  connectedWallet: {
    border: ".5px solid #828282",
    color: "#000",
    opacity: "0.87",
    "&:hover": {
      background: "transparent",
    },
  },
  popoverImg: {
    width: "1rem",
    height: "1rem",
    margin: "0 8px",
    "@media(min-width: 1024px)": {
      width: "1.5rem",
      height: "1.5rem",
    },
  },
  popoverBtn: {
    display: "flex",
    color: "#2F80ED",
    paddingBottom: "1.5rem",
    fontWeight: "300",
    fontSize: "1rem",
    textTransform: "none",
    lineHeight: "30px",
    "&:hover": {
      background: "transparent",
    },
  },
  copyText: {
    color: "#000",
    opacity: "0.87",
    fontWeight: "400",
    fontSize: "1.25rem",
    paddingLeft: "1rem",
  },
  networkType: {
    color: "#000",
    opacity: "0.87",
    fontWeight: "400",
    fontSize: "1rem",
    lineHeight: "30px",
    padding: "1.25rem 0 1rem",
    textAlign: "center",
    "@media(max-width: 501px)": {
      fontSize: "0.625rem",
      paddingBottom: "0.5rem",
    },
  },
});

const PREFIX = "Header";
export const classes1 = {
  root: `${PREFIX}-root`,
  cta: `${PREFIX}-cta`,
  content: `${PREFIX}-content`,
};
export const HeaderCon = styled("div")(() => ({
  [`&.${classes1.root}`]: {
    backgroundColor: "#F9FAFC",
    paddingBottom: "3.0625rem",
  },
}));
export const Title = styled("p")(() => ({
  [`&.${classes1.content}`]: {
    color: "#000",
    opacity: "0.87",
    fontSize: "52px",
    fontWeight: "bold",
    lineHeight: "70px",
    letterSpacing: "0.005em",
    maxWidth: "159px",
  },
}));
