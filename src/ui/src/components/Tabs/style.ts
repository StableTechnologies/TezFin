import { makeStyles } from '@mui/styles';

// eslint-disable-next-line import/prefer-default-export
export const useStyles = makeStyles({
    root: {
        '& .MuiTabs-scroller': {
            width: '100%'
        },
        '& .MuiTabs-flexContainer': {
            borderBottom: '2px solid #E0E0E0'
        },
        '& .MuiButtonBase-root.Mui-selected': {
            color: '#000',
            opacity: '0.87'
        },
        '& .MuiButtonBase-root': {
            width: '50%',
            color: '#000',
            opacity: '0.6',
            textTransform: 'none',
            fontSize: '1rem',
            fontWeight: '700',
            '@media(max-width: 320px)': {
                fontSize: '0.875rem'
            }
        }
    }
});
