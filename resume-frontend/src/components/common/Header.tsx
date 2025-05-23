import React, { useState } from 'react';
import {
  AppBar,
  Box,
  Toolbar,
  Typography,
  Button,
  Container,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import DescriptionIcon from '@mui/icons-material/Description';
import WorkIcon from '@mui/icons-material/Work';
import GoogleLoginButton from '../Auth/GoogleLoginButton';

const Header: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  
  const [hoverHome, setHoverHome] = useState(false);

  const handleMobileMenuToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigateToHome = () => {
    navigate('/');
    if (mobileOpen) setMobileOpen(false);
  };

  const handleNavigateToMyResumes = () => {
    navigate('/resumes');
    if (mobileOpen) setMobileOpen(false);
  };

  const handleNavigateToJobSearch = () => {
    navigate('/job-search');
    if (mobileOpen) setMobileOpen(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
    if (mobileOpen) setMobileOpen(false);
  };

  return (
    <AppBar position="sticky" color="default" elevation={0}>
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1.5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography 
              variant="h5" 
              onClick={handleNavigateToHome}
              onMouseEnter={() => setHoverHome(true)}
              onMouseLeave={() => setHoverHome(false)}
              sx={{ 
                fontWeight: 700, 
                cursor: 'pointer',
                background: 'linear-gradient(90deg, #4f6df5 0%, #6c63ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mr: 4,
                display: { xs: 'none', sm: 'block' },
                transform: hoverHome ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              ResumAI
            </Typography>
            
            <Typography 
              variant="h6" 
              onClick={handleNavigateToHome}
              onMouseEnter={() => setHoverHome(true)}
              onMouseLeave={() => setHoverHome(false)}
              sx={{ 
                fontWeight: 700, 
                cursor: 'pointer',
                background: 'linear-gradient(90deg, #4f6df5 0%, #6c63ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'block', sm: 'none' },
                transform: hoverHome ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.2s ease'
              }}
            >
              RA
            </Typography>

            <IconButton
              color="inherit"
              edge="start"
              onClick={handleMobileMenuToggle}
              sx={{ display: { xs: 'flex', md: 'none' }, ml: 1 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center' }}>
            {user ? (
              <>
                <Button 
                  color="inherit"
                  onClick={handleNavigateToHome}
                  sx={{ 
                    mr: 2,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  Home
                </Button>
                <Button 
                  color="inherit"
                  onClick={handleNavigateToMyResumes}
                  sx={{ 
                    mr: 2,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  My Resumes
                </Button>
                <Button 
                  color="inherit"
                  onClick={handleNavigateToJobSearch}
                  sx={{ 
                    mr: 2,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  Job Search
                </Button>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  onClick={handleLogout}
                  sx={{ 
                    borderRadius: 2,
                    '&:hover': {
                      transform: 'scale(1.05)',
                      transition: 'transform 0.2s ease'
                    }
                  }}
                >
                  Logout
                </Button>
              </>
            ) : (
              <GoogleLoginButton />
            )}
          </Box>
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={mobileOpen}
        onClose={handleMobileMenuToggle}
        sx={{
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            ResumAI
          </Typography>
        </Box>
        <Divider />
        <List>
          <ListItem component="div" onClick={handleNavigateToHome}>
            <ListItemIcon>
              <HomeIcon color="primary" />
            </ListItemIcon>
            <ListItemText primary="Home" primaryTypographyProps={{ component: "div" }} />
          </ListItem>
          {user && (
            <>
              <ListItem component="div" onClick={handleNavigateToMyResumes}>
                <ListItemIcon>
                  <DescriptionIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="My Resumes" primaryTypographyProps={{ component: "div" }} />
              </ListItem>
              <ListItem component="div" onClick={handleNavigateToJobSearch}>
                <ListItemIcon>
                  <WorkIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Job Search" primaryTypographyProps={{ component: "div" }} />
              </ListItem>
            </>
          )}
        </List>
        <Divider />
        <Box sx={{ p: 2 }}>
          {user ? (
            <Button 
              variant="outlined" 
              color="primary" 
              onClick={handleLogout}
              fullWidth
              sx={{ borderRadius: 2 }}
            >
              Logout
            </Button>
          ) : (
            <GoogleLoginButton />
          )}
        </Box>
      </Drawer>
    </AppBar>
  );
};

export default Header; 