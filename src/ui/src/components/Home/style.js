import { makeStyles } from '@mui/styles';
import { styled } from '@mui/material/styles';

import meshgradient from '../../assets/mesh-gradient.svg';

const PREFIX = 'Home';
export const classes1 = {
    root: `${PREFIX}-root`,
    cta: `${PREFIX}-cta`,
    content: `${PREFIX}-content`
};
export const Button = styled('button')(({ theme }) => ({
    [`&.${classes1.cta}`]: {
        // backgroundColor: theme.palette.primary.main,
        backgroundColor: '#FFFFFF80',
        color: '#fff',
        padding: '1.21875rem 1.5rem',
        fontSize: '1.5rem',
        fontWeight: '500',
        lineHeight: '1.125rem',
        letterSpacing: '0.02em',
        textAlign: 'center',
        border: '0'
    }
}));

const useStyles = makeStyles({
    homeCon: {
        background: 'radial-gradient(50% 50% at 50% 50%, #8C7BCC 0%, rgba(140, 123, 204, 0) 81.25%)',
        backgroundImage: 'radial-gradient(100% 100% at 50% 50%, #8C7BCC 80%, rgba(140, 123, 204, 0) 81.25%)',
        // backgroundImage: 'radial-gradient(50% 50% at 50% 50%, #8C7BCC 0%, rgba(140, 123, 204, 0) 81.25%)',
        // background: 'red',
        // transform: 'rotate(60.05deg)',
        color: '#fff',
        width: '100%',
        height: '80%',
        // backgroundSize: 'auto',
        // backgroundImage: "url(meshgradient)",
        position: 'absolute'

    }
});

export default useStyles;
