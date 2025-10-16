import { createTheme, adaptV4Theme } from '@mui/material/styles';

const theme = createTheme(adaptV4Theme({
    typography: {
        fontFamily: [
            'Inter',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'sans-serif'
        ].join(','),
        fontWeightRegular: 400,
        fontWeightMedium: 500,
        fontWeightBold: 600
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                html: {
                    fontFamily: 'Inter, sans-serif',
                },
                body: {
                    fontFamily: 'Inter, sans-serif',
                }
            }
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    fontFamily: 'Inter, sans-serif',
                }
            }
        },
        MuiTableCell: {
            styleOverrides: {
                root: {
                    fontFamily: 'Inter, sans-serif',
                }
            }
        },
        MuiTypography: {
            styleOverrides: {
                root: {
                    fontFamily: 'Inter, sans-serif',
                }
            }
        }
    }
}));

export default theme;
