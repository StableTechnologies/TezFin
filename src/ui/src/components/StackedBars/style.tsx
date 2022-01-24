import { makeStyles } from '@mui/styles';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';


export const useStyles = makeStyles({
   progressBar: {
    display: 'flex',
    backgroundColor: '#EAEAEA',
    height: '16px',
    maxWidth: '100%'
  },

  progress: {
    height: '16px',
    transition: 'width 0.5s ease-in'
  }
});

export const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
  <Tooltip {...props} classes={{ popper: className }} arrow/>
))(({ theme }) => ({
  [`& .${tooltipClasses.tooltip}`]: {
    backgroundColor: theme.palette.common.white,
    color: '#000',
    fontSize: 12,
    letterSpacing: '0.005em',
    marginTop: '9px !important',
    boxShadow: '0px 2px 4px 0px rgba(0, 0, 0, 0.25)'

    // marginRight: '30px'
  },
  [`& .${tooltipClasses.arrow}`]: {
    color: '#fff',
  },
}));