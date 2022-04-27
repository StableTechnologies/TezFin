/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    root: {
        '& .MuiTypography-root': {
            '@media(max-width: 501px)': {
                fontSize: '0.75rem'
            },
            '@media(max-width: 320px)': {
                fontSize: '0.625rem'
            }
        },
        // '& .MuiTable-root': {
        //     '& .MuiTableRow-root': {
        //         '& .MuiTableCell-root:first-of-type': {
        //             padding: '1.25rem',
        //             paddingLeft: '.75rem',
        //             '@media(min-width: 1200px)': {
        //                 paddingLeft: '1.5rem'
        //             }
        //         },
        //         '& .MuiTableCell-root:last-of-type': {
        //             paddingRight: '.75rem',
        //             '@media(min-width: 1200px)': {
        //                 paddingRight: '2.75rem'
        //             }
        //         }
        //     }
        // },
        // '& .MuiTableCell-root': {
        //     color: '#000',
        //     borderBottom: '1px solid #E0E0E0',
        //     padding: '.75rem',
        //     whiteSpace: 'nowrap',
        //     '@media(min-width: 1200px)': {
        //         paddingLeft: '1.5rem'
        //     },
        //     '@media(max-width: 501px)': {
        //         padding: '.5rem'
        //     }
        // },
        // '& .MuiTableHead-root ': {
        //     '& .MuiTableRow-root': {
        //         height: '3.5rem'
        //     },
        //     '& .MuiTableCell-root': {
        //         color: '#BDBDBD',
        //         fontSize: '.875rem',
        //         '@media(min-width: 768px)': {
        //             minWidth: '5.5625rem'
        //         },
        //         '@media(max-width: 1200px)': {
        //             fontSize: '0.75rem'
        //         },
        //         '@media(max-width: 501px)': {
        //             fontSize: '0.625rem'
        //         },
        //         '@media(max-width: 320px)': {
        //             fontSize: '0.75rem'
        //         }
        //     }
        // },
        '& .MuiTableBody-root ': {
            // '& .MuiTableRow-root': {
            //     height: '4.5rem',
            //     '&:hover': {
            //         background: '#DDF5FC66'
            //     }
            // },
            '& .MuiTableCell-root': {
                color: '#000',
                fontStyle: 'normal',
                fontWeight: '300',
                fontSize: '1rem',
                lineHeight: '30px'
                // fontWeight: '300',
                // '@media(min-width: 1200px)': {
                //     fontSize: '1rem'
                // },
                // '@media(max-width: 768px)': {
                //     fontSize: '0.875rem'
                // },
                // '@media(max-width: 501px)': {
                //     fontSize: '0.75rem'
                // }
            }
        }
    },
    tableCon: {
        border: '1px solid #E0E0E0',
        borderBottom: '0',
        borderRadius: '1rem',
        // margin: '155px 87px 131px',
        '&::-webkit-scrollbar': {
            display: 'none'
        }
    },
    img: {
        width: '2rem',
        height: '2rem',
        marginTop: '-4px',
        marginRight: '8px'
        // '@media (min-width: 769px) and (max-width: 1024px)': {
        //     width: '1.5rem',
        //     height: '1.5rem',
        //     marginBottom: '-6px'
        // },
        // '@media(max-width: 768px)': {
        //     width: '1.5rem',
        //     height: '1.5rem',
        //     marginBottom: '-8px'
        // },
        // '@media(max-width: 501px)': {
        //     width: '1rem',
        //     height: '1rem',
        //     marginBottom: '-4px'
        // }
    },
    address: {
        fontStyle: 'normal',
        fontWeight: '300',
        fontSize: '1rem',
        lineHeight: '30px'
    },
    copyICon: {
        width: '1rem',
        height: '1rem',
        marginTop: '8px'
    },
    flexAdd: {
        display: 'flex'
    },
    justifyEnd: {
        justifyContent: 'end'
    },
    justifyCenter: {
        justifyContent: 'center'
    }
});
