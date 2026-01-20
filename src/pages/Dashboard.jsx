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
} from '@mui/material';
import {
  People as PeopleIcon,
  Payment as PaymentIcon,
  AttachMoney as MoneyIcon,
  TrendingUp as TrendingUpIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
  Notifications as NotificationsIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';

function Dashboard() {
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
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
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
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        Dashboard Overview
      </Typography>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{borderRadius:3}}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Members
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {stats.totalUsers}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                  <PeopleIcon />
                </Avatar>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Chip 
                  label={`${stats.activeUsers} Active`} 
                  color="success" 
                  size="small" 
                  variant="outlined"
                />
                <Chip 
                  label={`${stats.expiredUsers} Expired`} 
                  color="error" 
                  size="small" 
                  variant="outlined"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{borderRadius:3}}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                    {formatCurrency(stats.totalRevenue)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.main' }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 1 }}>
                <TrendingUpIcon fontSize="small" />
                Monthly average: {formatCurrency(stats.totalRevenue / 12)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{borderRadius:3}}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Pending Payments
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'warning.main' }}>
                    {formatCurrency(stats.pendingPayments)}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.main' }}>
                  <PaymentIcon />
                </Avatar>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                From {stats.expiredUsers} expired members
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{borderRadius:3}}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    Upcoming Expiries
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                    {upcomingExpiries.length}
                  </Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.main' }}>
                  <CalendarIcon />
                </Avatar>
              </Box>
              <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: 'block' }}>
                Within next 7 days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Recent Members */}
        <Grid item xs={12} md={6}>
          <Card sx={{borderRadius:3}}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  Recent Members
                </Typography>
                <IconButton component={Link} to="/add-user" size="small">
                  <PersonAddIcon />
                </IconButton>
              </Box>
              
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Join Date</TableCell>
                      <TableCell>Plan</TableCell>
                      <TableCell>Status</TableCell>
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
                                {user.name}
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
                <Alert severity="info" sx={{ mt: 2 }}>
                  No members found. Add your first member!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Expiries */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                  Upcoming Expiries
                </Typography>
                <NotificationsIcon color="warning" />
              </Box>
              
              {upcomingExpiries.length > 0 ? (
                <Stack spacing={2}>
                  {upcomingExpiries.map((user) => {
                    const daysUntil = getDaysUntilExpiry(user.planEndDate);
                    
                    return (
                      <Card key={user.id} variant="outlined" sx={{ p: 1.5 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'medium' }}>
                              {user.name}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              Plan: {user.planName}
                            </Typography>
                          </Box>
                          <Box sx={{ textAlign: 'right' }}>
                            <Typography variant="caption" color="textSecondary" display="block">
                              Expires on
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {formatDate(user.planEndDate)}
                            </Typography>
                            <Chip 
                              label={`${daysUntil} days left`} 
                              size="small"
                              color={daysUntil <= 3 ? 'error' : daysUntil <= 7 ? 'warning' : 'info'}
                              sx={{ mt: 0.5 }}
                            />
                          </Box>
                        </Box>
                      </Card>
                    );
                  })}
                </Stack>
              ) : (
                <Alert severity="success">
                  No upcoming expiries in the next 7 days.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Card sx={{ mt: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center', cursor: 'pointer' ,backgroundColor:"transparent",border:"none"}} component={Link} to="/add-user">
                <PersonAddIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Add New Member</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center', cursor: 'pointer',backgroundColor:"transparent",border:"none"}} component={Link} to="/user-list">
                <PeopleIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">View All Members</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center', cursor: 'pointer',backgroundColor:"transparent",border:"none"}} component={Link} to="/payment-management">
                <PaymentIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Collect Payments</Typography>
              </Card>
            </Grid>
            <Grid item xs={6} md={3}>
              <Card variant="outlined" sx={{ p: 2, textAlign: 'center', cursor: 'pointer',backgroundColor:"transparent",border:"none"}} component={Link} to="/plans">
                <MoneyIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="body2">Manage Plans</Typography>
              </Card>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </Box>
  );
}

export default Dashboard;