/* eslint-disable import/prefer-default-export */
import { makeStyles } from '@mui/styles';

export const useStyles = makeStyles({
    btnSub: {
        background: '#39E4B8',
        color: '#fff',
        '&:hover': {
            background: '#30D3AA'
        }
    },

    collateralizePadding: {
        paddingTop: '0.6875rem !important',
        paddingBottom: '6.8125rem !important'
    }

});
