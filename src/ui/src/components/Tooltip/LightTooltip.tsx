// eslint-disable-next-line no-use-before-define
import React from 'react';

import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import { styled } from '@mui/material/styles';

const LightTooltip = styled(({ className, ...props }: TooltipProps) => (
    <Tooltip {...props} classes={{ popper: className }} arrow/>
))(() => ({
    [`& .${tooltipClasses.tooltip}`]: {
        backgroundColor: 'rgba(255, 255, 255, 1)',
        color: '#000',
        fontSize: 12,
        letterSpacing: '0.005em',
        boxShadow: `0px 4px 4px -1px rgba(12, 12, 13, 0.05),
            0px 4px 4px -1px rgba(12, 12, 13, 0.1)`,
        border: '3px solid #2157E4',
        borderRadius: 8,
    },
    [`& .${tooltipClasses.arrow}`]: {
        color: 'rgba(255, 255, 255, 1)',
        filter: 'drop-shadow(0px 2px 4px 0px rgba(0, 0, 0, 0.5))',
        '&:before': {
            border: '3px solid #2157E4',
        }
    }
}));

export default LightTooltip;
