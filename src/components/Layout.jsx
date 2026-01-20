import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  useMediaQuery,
  BottomNavigation,
  BottomNavigationAction,
  Paper,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  AttachMoney as MoneyIcon,
  Logout as LogoutIcon,
  ChevronLeft as ChevronLeftIcon,
  CurrencyRupee as CurrencyRupeeIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';

const drawerWidth = 240;

const menuItems = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Add New Member', icon: <PersonAddIcon />, path: '/add-user' },
  { text: 'Members List', icon: <PeopleIcon />, path: '/user-list' },
  { text: 'Payment Management', icon: <PaymentIcon />, path: '/payment-management' },
  { text: 'Plans Management', icon: <CurrencyRupeeIcon />, path: '/plans' }, // Changed to Rupees icon
];

// Create dark theme with sky blue accent
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00b4d8', // Sky blue
      light: '#48cae4',
      dark: '#0096c7',
    },
    secondary: {
      main: '#00b4d8', // Sky blue for secondary
    },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
    text: {
      primary: '#e0e0e0',
      secondary: '#b0b0b0',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    h6: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    body1: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    button: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
    },
  },
  components: {
    MuiListItemButton: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(0, 180, 216, 0.16)',
            borderRight: '3px solid #00b4d8',
            '&:hover': {
              backgroundColor: 'rgba(0, 180, 216, 0.24)',
            },
          },
        },
      },
    },
    MuiBottomNavigationAction: {
      styleOverrides: {
        root: {
          padding: '6px 0px 8px',
          minWidth: '50px',
          '&.Mui-selected': {
            color: '#00b4d8',
            paddingTop: '8px',
          },
        },
      },
    },
    MuiBottomNavigation: {
      styleOverrides: {
        root: {
          height: '68px',
          paddingTop: '6px',
          paddingBottom: '6px',
        },
      },
    },
  },
});

function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Media queries for responsive design
  const isMobile = useMediaQuery('(max-width: 899px)');
  const isExtraSmall = useMediaQuery('(max-width: 250px)');

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleProfileMenuClose();
    navigate('/');
  };

  // Get active menu item for mobile bottom navigation
  const getActiveMobileMenu = () => {
    const index = menuItems.findIndex(item => item.path === location.pathname);
    return index !== -1 ? index : 0;
  };

  const drawer = (
    <Box sx={{ height: '100%', bgcolor: 'background.paper' }}>
      <Toolbar sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        bgcolor: 'primary.dark',
        minHeight: '64px !important',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
            HULK FITNESS
          </Typography>
        </Box>
        <IconButton 
          onClick={handleDrawerToggle} 
          sx={{ 
            display: { xs: 'inline-flex', sm: 'none' },
            color: 'white'
          }}
        >
          <ChevronLeftIcon />
        </IconButton>
      </Toolbar>
      <Divider />
      <List sx={{ pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                mx: 1,
                my: 0.5,
                borderRadius: 1,
                '&.Mui-selected': {
                  bgcolor: 'rgba(0, 180, 216, 0.16)',
                  borderRight: '3px solid',
                  borderColor: 'primary.main',
                  '& .MuiListItemIcon-root': {
                    color: 'primary.main',
                  },
                  '& .MuiListItemText-primary': {
                    fontWeight: 600,
                    color: 'primary.light',
                  },
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  minWidth: 40,
                }}
              >
                {item.text === 'Plans Management' ? <CurrencyRupeeIcon /> : item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                primaryTypographyProps={{
                  fontFamily: 'Poppins',
                  fontSize: '0.9rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </Box>
  );

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', minHeight: '100vh' }}>
        <AppBar
          position="fixed"
          sx={{
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            ml: { sm: `${drawerWidth}px` },
            bgcolor: 'background.paper',
            color: 'text.primary',
            borderBottom: '1px solid',
            borderColor: 'divider',
            boxShadow: 'none',
          }}
        >
          <Toolbar>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                color: 'primary.main'
              }}
            >
              <MenuIcon />
            </IconButton>
            <Typography 
              variant="h6" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontFamily: 'Poppins',
                fontWeight: 600,
                color: 'primary.light'
              }}
            >
              {menuItems.find(item => item.path === location.pathname)?.text || 'Gym Management'}
            </Typography>
            
            <IconButton 
              onClick={handleProfileMenuOpen} 
              size="small"
              sx={{ 
                border: '2px solid',
                borderColor: 'primary.main'
              }}
            >
              <Avatar sx={{ 
                width: 32, 
                height: 32, 
                bgcolor: 'primary.main',
                color: 'black',
                fontWeight: 'bold'
              }}>
                H
              </Avatar>
            </IconButton>
            
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleProfileMenuClose}
              PaperProps={{
                sx: {
                  bgcolor: 'background.paper',
                  mt: 1.5,
                  minWidth: 180,
                }
              }}
            >
              <MenuItem 
                onClick={handleLogout}
                sx={{
                  fontFamily: 'Poppins',
                  '&:hover': {
                    bgcolor: 'rgba(0, 180, 216, 0.1)',
                  }
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" sx={{ color: 'primary.main' }} />
                </ListItemIcon>
                <Typography fontFamily="Poppins">Logout</Typography>
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>
        
        {/* Desktop Sidebar */}
        <Box
          component="nav"
          sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        >
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={handleDrawerToggle}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', sm: 'none' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                bgcolor: 'background.paper',
              },
            }}
          >
            {drawer}
        </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', sm: 'block' },
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                bgcolor: 'background.paper',
                borderRight: '1px solid',
                borderColor: 'divider',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
        
        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            p: { xs: 2, sm: 3 },
            width: { sm: `calc(100% - ${drawerWidth}px)` },
            mt: { xs: 7, sm: 8 },
            mb: isMobile && !isExtraSmall ? 9 : 0, // Increased bottom padding for mobile navigation
            minHeight: 'calc(100vh - 64px)',
            bgcolor: 'background.default',
          }}
        >
          {children}
        </Box>
        
        {/* Mobile Bottom Navigation - Hidden below 250px */}
        {isMobile && !isExtraSmall && (
          <Paper
            sx={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              display: { xs: 'block', sm: 'none' },
              bgcolor: 'background.paper',
              borderTop: '2px solid',
              borderColor: 'primary.dark',
              zIndex: 1100,
              borderRadius: '12px 12px 0 0',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.3)',
              height: '72px',
            }}
            elevation={3}
          >
            <BottomNavigation
              showLabels
              value={getActiveMobileMenu()}
              onChange={(event, newValue) => {
                navigate(menuItems[newValue].path);
              }}
              sx={{
                bgcolor: 'transparent',
                height: '100%',
                padding: '6px 0',
                '& .MuiBottomNavigationAction-root': {
                  minWidth: '50px',
                  padding: '8px 0 6px',
                  margin: '0 2px',
                  transition: 'all 0.2s ease',
                  '&.Mui-selected': {
                    color: '#00b4d8',
                    paddingTop: '10px',
                    transform: 'translateY(-4px)',
                    '& .MuiBottomNavigationAction-label': {
                      fontSize: '0.75rem',
                      fontWeight: 600,
                    },
                  },
                },
              }}
            >
              {menuItems.map((item, index) => (
                <BottomNavigationAction
                  key={item.text}
                  label={item.text}
                  icon={item.text === 'Plans Management' ? 
                    <CurrencyRupeeIcon sx={{ fontSize: 24 }} /> : 
                    React.cloneElement(item.icon, { sx: { fontSize: 24 } })
                  }
                  sx={{
                    '& .MuiBottomNavigationAction-label': {
                      fontFamily: 'Poppins',
                      fontSize: '0.7rem',
                      mt: 0.5,
                      transition: 'all 0.2s ease',
                      '&.Mui-selected': {
                        fontSize: '0.75rem',
                        fontWeight: 600,
                      }
                    },
                  }}
                />
              ))}
            </BottomNavigation>
          </Paper>
        )}
      </Box>
    </ThemeProvider>
  );
}

export default Layout;