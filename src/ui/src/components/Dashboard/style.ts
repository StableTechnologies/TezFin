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
        '& .MuiTable-root': {
            '& .MuiTableRow-root': {
                '& .MuiTableCell-root:first-of-type': {
                    padding: '1.25rem',
                    paddingLeft: '.75rem',
                    '@media(min-width: 1200px)': {
                        paddingLeft: '1.5rem'
                    }
                },
                '& .MuiTableCell-root:last-of-type': {
                    paddingRight: '.75rem',
                    '@media(min-width: 1200px)': {
                        paddingRight: '2.75rem'
                    }
                }
            }
        },
        '& .MuiTableCell-root': {
            color: '#000',
            borderBottom: '1px solid #E0E0E0',
            padding: '.75rem',
            whiteSpace: 'nowrap',
            '@media(min-width: 1200px)': {
                paddingLeft: '1.5rem'
            },
            '@media(max-width: 501px)': {
                padding: '.5rem'
            }
        },
        '& .MuiTableHead-root ': {
            '& .MuiTableRow-root': {
                height: '3.5rem'
            },
            '& .MuiTableCell-root': {
                color: '#BDBDBD',
                fontSize: '.875rem',
                '@media(min-width: 768px)': {
                    minWidth: '5.5625rem'
                },
                '@media(max-width: 1200px)': {
                    fontSize: '0.75rem'
                },
                '@media(max-width: 501px)': {
                    fontSize: '0.625rem'
                },
                '@media(max-width: 320px)': {
                    fontSize: '0.75rem'
                }
            }
        },
        '& .MuiTableBody-root ': {
            '& .MuiTableRow-root': {
                height: '4.5rem',
                '&:hover': {
                    background: '#DDF5FC66'
                }
            },
            '& .MuiTableCell-root': {
                fontWeight: '300',
                '@media(min-width: 1200px)': {
                    fontSize: '1rem'
                },
                '@media(max-width: 768px)': {
                    fontSize: '0.875rem'
                },
                '@media(max-width: 501px)': {
                    fontSize: '0.75rem'
                }
            }
        }
    },
    tableCon: {
        border: '1px solid #E0E0E0',
        borderBottom: '0',
        borderRadius: '1rem',
        '&::-webkit-scrollbar': {
            display: 'none'
        }
    },
    questionCircleIcon: {
        width: '1rem',
        height: '1rem',
        marginBottom: '-3px'
    },
    img: {
        width: '2rem',
        height: '2rem',
        marginBottom: '-10px',
        '@media (min-width: 769px) and (max-width: 1024px)': {
            width: '1.5rem',
            height: '1.5rem',
            marginBottom: '-6px'
        },
        '@media(max-width: 768px)': {
            width: '1.5rem',
            height: '1.5rem',
            marginBottom: '-8px'
        },
        '@media(max-width: 501px)': {
            width: '1rem',
            height: '1rem',
            marginBottom: '-4px'
        }
    },
    tokenName: {
        display: 'inline',
        fontSize: '1rem',
        fontWeight: '300',
        letterSpacing: '0.005em',
        lineHeight: '1.875rem',
        '@media(max-width: 1200px)': {
            fontSize: '0.875rem'
        },
        '@media(max-width: 768px)': {
            fontSize: '0.75rem'
        }
    },
    faintFont: {
        color: '#828282',
        fontWeight: '400'
    },
    dashboard: {
        background: '#fff',
        padding: '0px 6.25rem 10.125rem',
        '@media(max-width: 1024px)': {
            padding: '0px 4rem 10.125rem'
        },
        '@media(max-width: 900px)': {
            padding: '0px 2rem 10.125rem'
        },
        '@media(max-width: 768px)': {
            padding: '0px 4rem 10.125rem'
        },
        '@media(max-width: 501px)': {
            padding: '0px 1rem 10.125rem'
        }
    },
    borrowTablePadding: {
        '@media(min-width: 900px)': {
            paddingLeft: '0.875rem'
        },
        '@media(min-width: 1024px)': {
            paddingLeft: '0.9375rem'
        },
        '@media(min-width: 1200px)': {
            paddingLeft: '1.875rem'
        }
    },
    supplyTablePadding: {
        '@media(min-width: 900px)': {
            paddingRight: '0.875rem'
        },
        '@media(min-width: 1024px)': {
            paddingRight: '0.9375rem'
        },
        '@media(min-width: 1200px)': {
            paddingRight: '1.875rem'
        }
    },
    tableTitle: {
        padding: ' 1.5rem 0 .5rem',
        fontSize: '1.25rem',
        fontWeight: '500',
        lineHeight: '30px'
    },
    tableTitleTwo: {
        color: '#BDBDBD',
        padding: ' 36px 0 .5rem 8px',
        fontSize: '0.875rem',
        fontWeight: '500',
        lineHeight: '26px',
        letterSpacing: '0.05em'
    },
    emptyStateText: {
        color: '#000',
        fontSize: '1rem',
        fontWeight: '300',
        lineHeight: '30px',
        letterSpacing: '0.005em',
        '@media(min-width: 768px)': {
            padding: '21px 35px 21px 30px !important'
        }
    },
    collateralPadding: {
        '@media(min-width: 968px)': {
            paddingRight: '.5rem !important'
        },
        '@media(min-width: 1200px)': {
            paddingRight: '2rem !important'
        }
    },
    switchPadding: {
        '@media(min-width: 501px)': {
            paddingRight: '2.5rem !important'
        },
        '@media(min-width: 968px)': {
            paddingRight: '2rem !important'
        },
        '@media(min-width: 1200px)': {
            paddingRight: '4rem !important'
        }
    }
});
