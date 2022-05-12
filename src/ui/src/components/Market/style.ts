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
        '& .MuiTableHead-root ': {
            '& .MuiTableRow-root': {
                height: '3.5rem'
            },
            '& .MuiTableCell-root': {
                color: '#000',
                opacity: '0.6',
                fontSize: '.875rem',
                fontWeight: '500',
                lineHeight: '26px'
            }
        },
        '& .MuiTableBody-root ': {
            '& .MuiTableRow-root': {
                height: '6rem',
                '&:hover': {
                    background: '#DDF5FC66'
                }
            },
            '& .MuiTableCell-root': {
                color: '#000',
                opacity: '0.87',
                fontStyle: 'normal',
                fontWeight: '400',
                fontSize: '1rem',
                lineHeight: '30px'
            }
        },
        '& .MuiTableCell-root': {
            whiteSpace: 'nowrap'
        }
    },
    container: {
        padding: '5.5rem 6.25rem 8.1875rem',
        '@media(max-width: 1024px)': {
            padding: '4rem 4rem 8.1875rem'
        }
    },
    tableCon: {
        background: '#fff',
        border: '1px solid #E0E0E0',
        borderBottom: '0',
        borderRadius: '1rem',
        '&::-webkit-scrollbar': {
            display: 'none'
        }
    },
    tableTitle: {
        paddingBottom: '1.5rem',
        fontWeight: '500',
        fontSize: '20px',
        lineHeight: '30px'
    },
    img: {
        width: '2rem',
        height: '2rem',
        marginTop: '-4px',
        marginRight: '8px',
        '@media(max-width: 1024px)': {
            width: '1.5rem',
            height: '1.5rem',
            marginTop: '2px'
        }
    },
    cellContent: {
        fontStyle: 'normal',
        fontWeight: '400',
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
    alignTokens: {
        paddingLeft: '1.2rem',
        '@media(max-width: 1024px)': {
            paddingLeft: '0.5rem'
        }
    }
});
