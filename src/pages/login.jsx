import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Container,
  Paper,
  CircularProgress,
  InputAdornment,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { 
  FitnessCenter,
  Email,
  Lock,
  Visibility,
  VisibilityOff 
} from '@mui/icons-material';
import { useAuth } from '../components/AuthContext';
import { useNavigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';

// Create dark theme with sky blue accent
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00b4d8', // Sky blue
      light: '#48cae4',
      dark: '#0096c7',
      contrastText: '#fff',
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
    h4: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    h5: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 600,
    },
    body2: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
    },
    button: {
      fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
      fontWeight: 500,
    },
  },
  components: {
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            '&:hover fieldset': {
              borderColor: '#00b4d8',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#00b4d8',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          fontWeight: 600,
          transition: 'all 0.3s ease',
          '&:hover': {
            transform: 'translateY(-2px)',
            boxShadow: '0 4px 20px rgba(0, 180, 216, 0.3)',
          },
        },
        containedPrimary: {
          background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #48cae4 0%, #00b4d8 100%)',
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1e1e1e',
          border: '1px solid rgba(0, 180, 216, 0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#1e1e1e',
          border: '1px solid rgba(255, 255, 255, 0.05)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        },
      },
    },
  },
});

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container 
        component="main" 
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: { xs: 1, sm: 2 },
          background:{xs:'linear-gradient(135deg, #0a1929 0%, #121212 100%)', sm:'none'} ,
        }}
      >
        <Box
          sx={{
            width: '100%',
            maxWidth: { xs: '100%', sm: '450px', md: '500px' },
            margin: 'auto',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Paper
            elevation={24}
            sx={{
              padding: { xs: 2.5, sm: 4 },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              borderRadius: 4,
              width: '100%',
              maxWidth: '500px',
              backdropFilter: 'blur(10px)',
              background: 'rgba(30, 30, 30, 0.95)',
              border: '1px solid rgba(0, 180, 216, 0.2)',
              position: 'relative',
              overflow: 'hidden',
              mx: 'auto',
            }}
          >
            {/* Decorative elements */}
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: { xs: 80, sm: 100, md: 120 },
                height: { xs: 80, sm: 100, md: 120 },
                background: 'radial-gradient(circle, rgba(0, 180, 216, 0.1) 0%, rgba(0, 180, 216, 0) 70%)',
                borderRadius: '0 0 0 100%',
                zIndex: 0,
              }}
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: { xs: 70, sm: 90, md: 100 },
                height: { xs: 70, sm: 90, md: 100 },
                background: 'radial-gradient(circle, rgba(0, 180, 216, 0.08) 0%, rgba(0, 180, 216, 0) 70%)',
                borderRadius: '0 100% 0 0',
                zIndex: 0,
              }}
            />
            
            <Box sx={{ 
              position: 'relative', 
              zIndex: 1, 
              width: '100%',
              textAlign: 'center',
            }}>
              {/* Logo and Brand Name */}
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', sm: 'row' },
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                  gap: { xs: 1, sm: 2 },
                }}
              >
                <Box
                  sx={{
                    width: { xs: 50, sm: 60, md: 60 },
                    height: { xs: 50, sm: 60, md: 60 },
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 20px rgba(0, 180, 216, 0.4)',
                    flexShrink: 0,
                  }}
                >
                  <FitnessCenter sx={{ 
                    fontSize: { xs: 24, sm: 28, md: 32 }, 
                    color: 'white' 
                  }} />
                </Box>
                <Typography 
                  variant="h4" 
                  component="h1" 
                  fontWeight="bold"
                  sx={{
                    background: 'linear-gradient(45deg, #00b4d8 30%, #48cae4 90%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' },
                  }}
                >
                  HulkFitness
                </Typography>
              </Box>
              
              <Typography 
                variant="h5" 
                component="h2" 
                gutterBottom 
                sx={{ 
                  color: 'primary.light',
                  fontSize: { xs: '1.25rem', sm: '1.5rem' },
                }}
              >
                Admin Login
              </Typography>
              
              <Typography 
                variant="body2" 
                color="text.secondary" 
                sx={{ 
                  mb: 3, 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                }}
              >
                Enter your credentials to access the dashboard
              </Typography>

              <Card sx={{ 
                width: '100%', 
                backgroundColor: 'transparent', 
                boxShadow: 'none',
                border: 'none',
              }}>
                <CardContent sx={{ p: 0 }}>
                  {error && (
                    <Alert 
                      severity="error" 
                      sx={{ 
                        mb: 2,
                        borderRadius: 2,
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        border: '1px solid rgba(244, 67, 54, 0.3)',
                        fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      }}
                    >
                      {error}
                    </Alert>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <TextField
                      fullWidth
                      label="Email Address"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      margin="normal"
                      autoComplete="email"
                      disabled={loading}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ 
                              color: 'primary.main',
                              fontSize: { xs: '1rem', sm: '1.25rem' }
                            }} />
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: 'primary.main',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        },
                      }}
                    />
                    
                    <TextField
                      fullWidth
                      label="Password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      margin="normal"
                      autoComplete="current-password"
                      disabled={loading}
                      size="small"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ 
                              color: 'primary.main',
                              fontSize: { xs: '1rem', sm: '1.25rem' }
                            }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              onClick={handleClickShowPassword}
                              edge="end"
                              sx={{ 
                                color: 'primary.main',
                                padding: { xs: '8px', sm: '12px' }
                              }}
                              size="small"
                            >
                              {showPassword ? 
                                <VisibilityOff fontSize={isMobile ? "small" : "medium"} /> : 
                                <Visibility fontSize={isMobile ? "small" : "medium"} />
                              }
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        },
                        '& .MuiInputLabel-root.Mui-focused': {
                          color: 'primary.main',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: { xs: '0.875rem', sm: '1rem' },
                        },
                      }}
                    />
                    
                    <Button
                      type="submit"
                      fullWidth
                      variant="contained"
                      size="large"
                      disabled={loading}
                      sx={{ 
                        mt: 3, 
                        mb: 2,
                        py: { xs: 1, sm: 1.5 },
                        fontSize: { xs: '0.875rem', sm: '1rem' },
                        borderRadius: 3,
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Sign In'
                      )}
                    </Button>
                  </form>
                  
                  <Typography 
                    variant="caption" 
                    color="text.secondary" 
                    sx={{ 
                      display: 'block', 
                      textAlign: 'center',
                      mt: 2,
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                    }}
                  >
                    © {new Date().getFullYear()} Ruzix Code
                  </Typography>
                </CardContent>
              </Card>
            </Box>
          </Paper>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default Login;