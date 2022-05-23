import { makeStyles } from '@mui/styles';

// eslint-disable-next-line import/prefer-default-export
export const useStyles = makeStyles({
    bannerCon: {
        background: '#FF8E021A',
        margin: '0 2.5rem 0',
        padding: '1rem 1rem 1rem 2rem',
        width: 'auto',
        '@media(min-width: 1200px)': {
            paddingRight: '29.6875rem'
        },
        '@media(max-width: 501px)': {
            margin: '0 1rem',
            padding: '1rem'
        }
    },
    bannerText: {
        color: '#5B3502',
        fontWeight: '400',
        fontSize: '1rem',
        lineHeight: '1.25rem',
        '@media(max-width: 501px)': {
            fontSize: '0.75rem'
        }
    },
    text_700: {
        fontWeight: '700'
    },
    warningCon: {
        marginRight: '1rem'
    },
    warningIcon: {
        width: '2rem',
        height: '2rem',
        '@media(max-width: 501px)': {
            width: '1.25rem',
            height: '1.25rem'
        }
    }
});
