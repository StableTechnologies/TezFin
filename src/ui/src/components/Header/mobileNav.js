import React from 'react';
import { NavLink } from 'react-router-dom';

import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';

import closeBtn from '../../assets/close.svg';
import hamburger from '../../assets/hamburger.svg';
import CloseButton from '../CloseButton';
import { useStyles } from './style';

const MobileNav = () => {
    const classes = useStyles();

    const [open, setOpen] = React.useState(false);

    const handleDrawerOpen = () => {
        setOpen(true);
    };

    const handleDrawerClose = () => {
        setOpen(false);
    };
    const drawerWidth = 240;
    return (
        <Box sx={{ display: 'flex' }} className={classes.mobileNav}>
            <Box sx={{ ...(open && { display: 'none' }) }}>
                <IconButton aria-label="close" onClick={handleDrawerOpen} className={classes.hamburgerCon} disableRipple>
                    <img src={hamburger} alt="hamburger-button" className={classes.hamburger} />
                </IconButton>
            </Box>
            <Drawer
                sx={{
                    width: 'auto',
                    height: 'auto',
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: 'auto',
                        height: 'auto'
                    }
                }}
                variant="persistent"
                anchor="right"
                open={open}
            >
                <Grid>
                    <CloseButton onClick={handleDrawerClose}/>
                </Grid> <br/>
                <List>
                    <ListItem button key={'Dashboard'} onClick={handleDrawerClose}>
                        <NavLink to="dashboard" className={classes.link}> Dashboard </NavLink>
                    </ListItem>
                    {/*<ListItem button key={'Market'} onClick={handleDrawerClose}>
                        <NavLink to="market" className={classes.link}> Market </NavLink>
                    </ListItem>
                    <ListItem button key={'About'} onClick={handleDrawerClose}>
                        <NavLink to="about" className={classes.link}> About </NavLink>
                    </ListItem>*/}
                </List>
            </Drawer>
        </Box>
    );
};

export default MobileNav;
