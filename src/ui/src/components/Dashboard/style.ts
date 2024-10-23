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
	  flexDirection: "column",
	  width: "100%",
	  alignItems: "center",
	  justifyContent: "center",
      "& .MuiTableRow-root": {
          paddingRight: "0rem",
          marginRight: "0rem",
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
	  padding: "-10px",
	  marginRight: "10px",
          borderBottom: "0",
        },
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
    padding: "0px",
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
	  //width: "7%",
	  //height: "7%",
    	  // marginRight: "20%",
	   width: "2.5rem",
    	   height: "2.5rem",
    	   marginRight: "1rem",
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
    padding: "0px",
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
    compositionOne: {
    },
  dashboard: {
        paddingLeft: '6.25rem',
        paddingRight: '6.25rem',
        '@media(max-width: 1024px)': {
            paddingLeft: '4rem',
            paddingRight: '4rem',
        },
        '@media(max-width: 900px)': {
            paddingLeft: '2rem',
            paddingRight: '2rem',
        },
        '@media(max-width: 768px)': {
            paddingLeft: '4rem',
            paddingRight: '4rem',
        },
        '@media(max-width: 501px)': {
            paddingLeft: '1rem',
            paddingRight: '1rem',
        },
  },
  borrowTablePadding: {
    "@media(max-width: 600px)": {
      paddingRight: "1.975rem",
    },
    "@media(min-width: 900px)": {
      paddingRight: "0.975rem",
    },
    "@media(min-width: 1024px)": {
      paddingRight: "0.9375rem",
    },
    "@media(min-width: 1200px)": {
      paddingRight: "0.875rem",
    },
  },
  supplyTablePadding: {
    "@media(min-width: 600px)": {
      paddingRight: "1rem",
    },
    "@media(min-width: 900px)": {
      paddingRight: "2rem",
    },
    "@media(min-width: 1024px)": {
      paddingRight: "2rem",
    },
    "@media(min-width: 1200px)": {
      paddingRight: "3rem",
    },
  },
   firstCell: {
     width: "10%",
   },
   secondCell: {
   },
   thirdCell: {
   },
   fourthCell: {
     width: "30%",
   },
   fifthCell: {
	   width: "30%",
	   right: "10px",
   },
   supplyButton: {
	   borderRadius: "8px",
	   marginRight: "30%",
	   marginLeft: "10%",
	   width: "50%",
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
