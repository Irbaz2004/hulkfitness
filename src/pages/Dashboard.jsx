import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  Chip,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Avatar,
  Stack,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  CurrencyRupee as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../Firebase/config';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function Dashboard() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    expiredUsers: 0,
    totalRevenue: 0,
    pendingPayments: 0,
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [upcomingExpiries, setUpcomingExpiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate?.() || new Date(),
        planEndDate: doc.data().planEndDate?.toDate?.() || null,
      }));

      // Calculate stats
      const today = new Date();
      const activeUsers = usersData.filter(user => 
        user.planEndDate && new Date(user.planEndDate) >= today
      ).length;
      
      const expiredUsers = usersData.filter(user => 
        user.planEndDate && new Date(user.planEndDate) < today
      ).length;

      // Fetch payments
      const paymentsSnapshot = await getDocs(collection(db, 'payments'));
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate?.() || null,
      }));

      const totalRevenue = paymentsData
        .filter(p => p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const pendingPayments = paymentsData
        .filter(p => p.status === 'pending')
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      // Get recent users (last 5)
      const recent = usersData
        .sort((a, b) => new Date(b.joinDate) - new Date(a.joinDate))
        .slice(0, 5);

      // Get upcoming expiries (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(today.getDate() + 7);
      
      const upcoming = usersData.filter(user => {
        if (!user.planEndDate) return false;
        const endDate = new Date(user.planEndDate);
        return endDate >= today && endDate <= nextWeek;
      }).sort((a, b) => new Date(a.planEndDate) - new Date(b.planEndDate))
        .slice(0, 5);

      setStats({
        totalUsers: usersData.length,
        activeUsers,
        expiredUsers,
        totalRevenue,
        pendingPayments,
      });

      setRecentUsers(recent);
      setUpcomingExpiries(upcoming);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    if (num >= 100000) {
      return `₹${(num / 100000).toFixed(1)}L`;
    }
    if (num >= 1000) {
      return `₹${(num / 1000).toFixed(1)}K`;
    }
    return `₹${num.toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-GB');
  };

  const getDaysUntilExpiry = (endDate) => {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography 
        variant="h4" 
        component="h1" 
        gutterBottom 
        sx={{ 
          mb: 4,
          fontSize: { xs: '1.5rem', sm: '1.75rem', md: '2.125rem' }
        }}
      >
        Dashboard Overview
      </Typography>

      {/* Stats Cards - Mobile Optimized */}
      <Grid container spacing={isMobile ? 1 : 2} sx={{ mb: { xs: 3, sm: 4 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: { xs: 2, sm: 3 },
            height: '100%',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Total Members
                  </Typography>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold' }}
                  >
                    {stats.totalUsers}
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
                    <Chip 
                      label={`${stats.activeUsers} Active`} 
                      color="success" 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, height: { xs: 20, sm: 24 } }}
                    />
                    <Chip 
                      label={`${stats.expiredUsers} Expired`} 
                      color="error" 
                      size="small" 
                      variant="outlined"
                      sx={{ fontSize: { xs: '0.6rem', sm: '0.7rem' }, height: { xs: 20, sm: 24 } }}
                    />
                  </Box>
                </Box>
                <Avatar sx={{ 
                  bgcolor: 'primary.light', 
                  color: 'white',
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  ml: 1
                }}>
                  <PeopleIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: { xs: 2, sm: 3 },
            height: '100%',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Total Revenue
                  </Typography>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold', color: 'success.main' }}
                  >
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 0.5, 
                      mt: 1,
                      fontSize: { xs: '0.6rem', sm: '0.75rem' }
                    }}
                  >
                    <TrendingUpIcon fontSize={isMobile ? "small" : "inherit"} />
                    Avg: {formatCurrency(stats.totalRevenue / 12)}
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: 'success.light', 
                  color: 'white',
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  ml: 1
                }}>
                  <MoneyIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: { xs: 2, sm: 3 },
            height: '100%',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Pending Payments
                  </Typography>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold', color: 'warning.main' }}
                  >
                    {formatCurrency(stats.pendingPayments)}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ 
                      mt: 1, 
                      display: 'block',
                      fontSize: { xs: '0.6rem', sm: '0.75rem' }
                    }}
                  >
                    From {stats.expiredUsers} members
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: 'warning.light', 
                  color: 'white',
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  ml: 1
                }}>
                  <PaymentIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card sx={{ 
            borderRadius: { xs: 2, sm: 3 },
            height: '100%',
            minHeight: { xs: 120, sm: 140 }
          }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    color="textSecondary" 
                    gutterBottom 
                    variant="body2"
                    sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                  >
                    Upcoming Expiries
                  </Typography>
                  <Typography 
                    variant={isMobile ? "h5" : "h4"} 
                    sx={{ fontWeight: 'bold' }}
                  >
                    {upcomingExpiries.length}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    color="textSecondary" 
                    sx={{ 
                      mt: 1, 
                      display: 'block',
                      fontSize: { xs: '0.6rem', sm: '0.75rem' }
                    }}
                  >
                    Next 7 days
                  </Typography>
                </Box>
                <Avatar sx={{ 
                  bgcolor: 'info.light', 
                  color: 'white',
                  width: { xs: 40, sm: 48 },
                  height: { xs: 40, sm: 48 },
                  ml: 1
                }}>
                  <CalendarIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={isMobile ? 2 : 3}>
        {/* Recent Members */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            borderRadius: { xs: 2, sm: 3 },
            height: '100%'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'medium',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Recent Members
                </Typography>
                <IconButton 
                  component={Link} 
                  to="/add-user" 
                  size={isMobile ? "small" : "medium"}
                  sx={{ p: { xs: 0.5, sm: 1 } }}
                >
                  <PersonAddIcon fontSize={isMobile ? "small" : "medium"} />
                </IconButton>
              </Box>
              
              {/* Mobile Cards View for Recent Members */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
                {recentUsers.map((user) => {
                  const isExpired = user.planEndDate && new Date(user.planEndDate) < new Date();
                  
                  return (
                    <Card key={user.id} variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ 
                              width: 40, 
                              height: 40, 
                              bgcolor: 'primary.light' 
                            }}>
                              <PeopleIcon fontSize="small" />
                            </Avatar>
                            <Box>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                                {user.name || 'No Name'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                Joined: {formatDate(user.joinDate)}
                              </Typography>
                            </Box>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Chip 
                              label={user.planName || 'No Plan'} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                              sx={{ mb: 0.5 }}
                            />
                            <Chip 
                              label={isExpired ? 'Expired' : 'Active'} 
                              size="small"
                              color={isExpired ? 'error' : 'success'}
                              variant={isExpired ? 'filled' : 'outlined'}
                            />
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
              
              {/* Desktop Table View */}
              <TableContainer 
                component={Paper} 
                variant="outlined"
                sx={{ 
                  display: { xs: 'none', md: 'block' },
                  maxHeight: 400,
                  borderRadius: 2
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.875rem' }}>Name</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>Join Date</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>Plan</TableCell>
                      <TableCell sx={{ fontSize: '0.875rem' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentUsers.map((user) => {
                      const isExpired = user.planEndDate && new Date(user.planEndDate) < new Date();
                      
                      return (
                        <TableRow key={user.id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 30, height: 30, bgcolor: 'primary.light' }}>
                                <PeopleIcon fontSize="small" />
                              </Avatar>
                              <Typography variant="body2">
                                {user.name || 'No Name'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {formatDate(user.joinDate)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={user.planName || 'No Plan'} 
                              size="small" 
                              color="primary"
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell>
                            <Chip 
                              label={isExpired ? 'Expired' : 'Active'} 
                              size="small"
                              color={isExpired ? 'error' : 'success'}
                              variant={isExpired ? 'filled' : 'outlined'}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
              
              {recentUsers.length === 0 && (
                <Alert 
                  severity="info" 
                  sx={{ 
                    mt: 2,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  No members found. Add your first member!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Expiries */}
        <Grid item xs={12} lg={6}>
          <Card sx={{ 
            borderRadius: { xs: 2, sm: 3 },
            height: '100%'
          }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    fontWeight: 'medium',
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Upcoming Expiries
                </Typography>
                <NotificationsIcon 
                  color="warning" 
                  fontSize={isMobile ? "small" : "medium"} 
                />
              </Box>
              
              {upcomingExpiries.length > 0 ? (
                <Stack spacing={isMobile ? 1.5 : 2}>
                  {upcomingExpiries.map((user) => {
                    const daysUntil = getDaysUntilExpiry(user.planEndDate);
                    
                    return (
                      <Card 
                        key={user.id} 
                        variant="outlined" 
                        sx={{ 
                          p: { xs: 1.5, sm: 2 },
                          borderLeft: `4px solid ${daysUntil <= 3 ? '#f44336' : daysUntil <= 7 ? '#ff9800' : '#2196f3'}`
                        }}
                      >
                        <Box sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: { xs: 'flex-start', sm: 'center' },
                          flexDirection: { xs: 'column', sm: 'row' },
                          gap: { xs: 1, sm: 0 }
                        }}>
                          <Box>
                            <Typography 
                              variant="subtitle2" 
                              sx={{ fontWeight: 'medium' }}
                            >
                              {user.name || 'No Name'}
                            </Typography>
                            <Typography 
                              variant="caption" 
                              color="textSecondary"
                              sx={{ display: 'block' }}
                            >
                              Plan: {user.planName || 'No Plan'}
                            </Typography>
                            {user.phone && (
                              <Typography 
                                variant="caption" 
                                color="textSecondary"
                                sx={{ display: 'block' }}
                              >
                                📞 {user.phone}
                              </Typography>
                            )}
                          </Box>
                          <Box sx={{ 
                            textAlign: { xs: 'left', sm: 'right' },
                            mt: { xs: 1, sm: 0 }
                          }}>
                            <Typography 
                              variant="caption" 
                              color="textSecondary" 
                              display="block"
                            >
                              Expires on
                            </Typography>
                            <Typography 
                              variant="body2" 
                              sx={{ fontWeight: 'medium' }}
                            >
                              {formatDate(user.planEndDate)}
                            </Typography>
                            <Chip 
                              label={`${daysUntil} days left`} 
                              size="small"
                              color={daysUntil <= 3 ? 'error' : daysUntil <= 7 ? 'warning' : 'info'}
                              sx={{ 
                                mt: 0.5,
                                fontSize: { xs: '0.6rem', sm: '0.7rem' },
                                height: { xs: 20, sm: 24 }
                              }}
                            />
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              ) : (
                <Alert 
                  severity="success"
                  sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                >
                  No upcoming expiries in the next 7 days.
                </Alert>
              )}
              
              {/* View All Button for Mobile */}
              {upcomingExpiries.length > 0 && isMobile && (
                <Button
                  fullWidth
                  variant="outlined"
                  component={Link}
                  to="/payment-management"
                  endIcon={<ArrowForwardIcon />}
                  sx={{ mt: 2 }}
                  size="small"
                >
                  Collect Payments
                </Button>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions - Responsive Grid */}
      <Card sx={{ 
        mt: { xs: 3, sm: 4 },
        borderRadius: { xs: 2, sm: 3 }
      }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Typography 
            variant="h6" 
            gutterBottom
            sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
          >
            Quick Actions
          </Typography>
          <Grid container spacing={isMobile ? 1 : 2}>
            {[
              { 
                icon: <PersonAddIcon color="primary" />, 
                label: 'Add New Member', 
                path: '/add-user' 
              },
              { 
                icon: <PeopleIcon color="primary" />, 
                label: 'View All Members', 
                path: '/user-list' 
              },
              { 
                icon: <PaymentIcon color="primary" />, 
                label: 'Collect Payments', 
                path: '/payment-management' 
              },
              { 
                icon: <MoneyIcon color="primary" />, 
                label: 'Manage Plans', 
                path: '/plans' 
              },
            ].map((action, index) => (
              <Grid item xs={6} sm={6} md={3} key={index}>
                <Card
                  variant="outlined"
                  component={Link}
                  to={action.path}
                  sx={{
                    p: { xs: 1.5, sm: 2 },
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: { xs: 100, sm: 120 },
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 180, 216, 0.05)',
                      transform: 'translateY(-2px)',
                    }
                  }}
                >
                  <Box sx={{ 
                    fontSize: { xs: 30, sm: 40, md: 40 },
                    mb: 1,
                    color: 'primary.main'
                  }}>
                    {action.icon}
                  </Box>
                  <Typography 
                    variant="body2"
                    sx={{ 
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      fontWeight: 500
                    }}
                  >
                    {action.label}
                  </Typography>
                </Card>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;