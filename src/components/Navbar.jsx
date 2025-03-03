import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, IconButton } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import SettingsIcon from '@mui/icons-material/Settings';
import HomeIcon from '@mui/icons-material/Home';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          AI System Design Interview Assistant
        </Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton 
            color={location.pathname === '/' ? 'secondary' : 'inherit'}
            onClick={() => navigate('/')}
            sx={{ mr: 1 }}
          >
            <HomeIcon />
          </IconButton>
          
          <Button
            color={location.pathname === '/interview' ? 'secondary' : 'inherit'}
            startIcon={<MicIcon />}
            onClick={() => navigate('/interview')}
            sx={{ mr: 1 }}
          >
            New Interview
          </Button>
          
          <IconButton
            color={location.pathname.includes('/review') ? 'secondary' : 'inherit'}
            onClick={() => navigate('/review/latest')}
            sx={{ mr: 1 }}
          >
            <AssessmentIcon />
          </IconButton>
          
          <IconButton
            color={location.pathname === '/settings' ? 'secondary' : 'inherit'}
            onClick={() => navigate('/settings')}
          >
            <SettingsIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;