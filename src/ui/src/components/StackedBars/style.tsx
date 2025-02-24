import { makeStyles } from '@mui/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

export const useStyles = makeStyles({
    progressBar: {
        display: 'flex',
        backgroundColor: '#EAEAEA',
        height: '40px',
        width: '100%',
        maxWidth: '100%'
    },
    progress: {
        height: '40px',
        transition: 'width 0.5s ease-in'
    },
    tooltipPrimaryText: {
        fontSize: '16px',
        fontWeight: 600,
        lineHeight: '22.4px',
        textAlign: 'center'
    },
    tooltipSecondaryText: {
        fontSize: '14px',
        fontWeight: 400,
        lineHeight: '19.6px',
        textAlign: 'center'
    }
});
