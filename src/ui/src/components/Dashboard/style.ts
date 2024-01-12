/* eslint-disable import/prefer-default-export */
import { makeStyles } from "@mui/styles";

export const useStyles = makeStyles({
  root: {
    "& .MuiTypography-root": {
      "@media(max-width: 501px)": {
        fontSize: "0.75rem",
      },
      "@media(max-width: 320px)": {
        fontSize: "0.625rem",
      },
    },
    "& .MuiTable-root": {
      "& .MuiTableRow-root": {
        "& .MuiTableCell-root:first-of-type": {
          padding: "1.25rem",
          paddingLeft: ".75rem",
          "@media(min-width: 1200px)": {
            paddingLeft: "1.5rem",
          },
        },
        "& .MuiTableCell-root:last-of-type": {
          paddingRight: ".75rem",
          "@media(min-width: 1200px)": {
            paddingRight: "2.75rem",
          },
        },
      },
    },
    "& .MuiTableCell-root": {
      color: "#000",
      borderBottom: "1px solid #E0E0E0",
      padding: ".75rem",
      whiteSpace: "nowrap",
      "@media(min-width: 1200px)": {
        paddingLeft: "1.5rem",
      },
      "@media(max-width: 501px)": {
        padding: ".5rem",
      },
    },
    "& .MuiTableHead-root ": {
      "& .MuiTableRow-root": {
        height: "3.5rem",
      },
      "& .MuiTableCell-root": {
        color: "#000",
        opacity: "0.6",
        fontSize: ".875rem",
        "@media(min-width: 768px)": {
          minWidth: "5.5625rem",
        },
        "@media(max-width: 1200px)": {
          fontSize: "0.75rem",
        },
        "@media(max-width: 501px)": {
          fontSize: "0.625rem",
        },
        "@media(max-width: 320px)": {
          fontSize: "0.75rem",
        },
      },
    },
    "& .MuiTableBody-root ": {
      "& .MuiTableRow-root:last-of-type": {
        "& .MuiTableCell-root": {
          borderBottom: "0",
        }
      },
      "& .MuiTableRow-root": {
        height: "4.5rem",
        "&:hover": {
          background: "#DDF5FC66",
        },
      },
      "& .MuiTableCell-root": {
        fontWeight: "400",
        "@media(min-width: 1200px)": {
          fontSize: "1rem",
        },
        "@media(max-width: 768px)": {
          fontSize: "0.875rem",
        },
        "@media(max-width: 501px)": {
          fontSize: "0.75rem",
        },
      },
    },
  },
  tableCon: {
    background: "#fff",
    borderBottom: "0",
    borderRadius: "1rem",
    "&::-webkit-scrollbar": {
      display: "none",
    },
    boxShadow: "2px 4px 23px 5px rgba(163,163,163,0.096)",
  },
  questionCircleIcon: {
    width: "1rem",
    height: "1rem",
    marginBottom: "-3px",
  },
  img: {
    width: "2.5rem",
    height: "2.5rem",
    marginRight: "7px",
    "@media (min-width: 769px) and (max-width: 1024px)": {
      width: "2.5rem",
      height: "2.5rem",
    },
    "@media(max-width: 768px)": {
      width: "2.5rem",
      height: "2.5rem",
    },
    "@media(max-width: 501px)": {
      width: "2.5rem",
      height: "2.5rem",
    },
  },
  tokenSymbol: {
    display: "inline",
    color: "#000",
    opacity: "0.6",
    fontSize: "1rem",
    fontWeight: "400",
    letterSpacing: "0.005em",
    lineHeight: "1.875rem",
    "@media(max-width: 1200px)": {
      fontSize: "1rem",
    },
    "@media(max-width: 768px)": {
      fontSize: "1rem",
    },
  },
  token: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    alignContent: "center",
    alignText: "center",
  },
  tokenTitle: {
    display: "flex",
    flexDirection: "column",
  },
  tokenName: {
    display: "inline",
    color: "#000",
    opacity: "0.87",
    fontSize: "1rem",
    fontWeight: "400",
    letterSpacing: "0.005em",
    lineHeight: "1.875rem",
    "@media(max-width: 1200px)": {
      fontSize: "1rem",
    },
    "@media(max-width: 768px)": {
      fontSize: "1rem",
    },
  },
  clearFont: {
    color: "#000",
    opacity: "0.87",
    fontWeight: "400",
  },
  faintFont: {
    color: "#000",
    opacity: "0.6",
    fontWeight: "400",
    fontSize: "0.875rem",
  },
  dashboard: {
    background: "#F9FAFC",
    padding: "0px 6.25rem 10.125rem",
    "@media(max-width: 1024px)": {
      padding: "0px 4rem 10.125rem",
    },
    "@media(max-width: 900px)": {
      padding: "0px 2rem 10.125rem",
    },
    "@media(max-width: 768px)": {
      padding: "0px 4rem 10.125rem",
    },
    "@media(max-width: 501px)": {
      padding: "0px 1rem 10.125rem",
    },
  },
  borrowTablePadding: {
    "@media(min-width: 900px)": {
      paddingLeft: "0.875rem",
    },
    "@media(min-width: 1024px)": {
      paddingLeft: "0.9375rem",
    },
    "@media(min-width: 1200px)": {
      paddingLeft: "1.875rem",
    },
  },
  supplyTablePadding: {
    "@media(min-width: 900px)": {
      paddingRight: "0.875rem",
    },
    "@media(min-width: 1024px)": {
      paddingRight: "0.9375rem",
    },
    "@media(min-width: 1200px)": {
      paddingRight: "1.875rem",
    },
  },
  tableTitle: {
    color: "#000",
    opacity: "0.87",
    padding: " 1.5rem 0 .5rem",
    fontSize: "1.25rem",
    fontWeight: "500",
    lineHeight: "30px",
  },
  emptyStateText: {
    color: "#000",
    fontSize: "1rem",
    fontWeight: "400",
    lineHeight: "30px",
    letterSpacing: "0.005em",
    "@media(min-width: 768px)": {
      padding: "21px 35px 21px 30px !important",
    },
  },
  collateralPadding: {
    "@media(min-width: 968px)": {
      paddingRight: ".5rem !important",
    },
    "@media(min-width: 1200px)": {
      paddingRight: "2rem !important",
    },
  },
  switchPadding: {
    "@media(min-width: 501px)": {
      paddingRight: "2.5rem !important",
    },
    "@media(min-width: 968px)": {
      paddingRight: "2rem !important",
    },
    "@media(min-width: 1200px)": {
      paddingRight: "4rem !important",
    },
  },
});
