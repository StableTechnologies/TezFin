import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} arrow/>
))(() => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: '#F9FAFC',
        color: '#000',
        fontSize: 12,
        letterSpacing: '0.005em',
        marginTop: '9px !important',
        boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)'
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: '#F9FAFC'
    }
}));

export default LightTooltip;
