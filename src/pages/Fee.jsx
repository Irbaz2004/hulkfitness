import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Button,
  Alert,
  Tooltip,
  Avatar,
  LinearProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Select,
  FormControl,
  InputLabel,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  CalendarToday as CalendarIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  DateRange as DateRangeIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp, addDoc, orderBy } from 'firebase/firestore';
import { db } from '../Firebase/config';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

function PaymentManagement() {
  const location = useLocation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  
  const [users, setUsers] = useState([]);
  const [plans, setPlans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('expired');
  const [selectedUser, setSelectedUser] = useState(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Memoized fetchData function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch users
      const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate?.() || new Date(),
        planEndDate: doc.data().planEndDate?.toDate?.() || null,
        lastPaymentDate: doc.data().lastPaymentDate?.toDate?.() || null,
      }));
      
      // Fetch plans
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Fetch payments
      const paymentsSnapshot = await getDocs(query(collection(db, 'payments'), orderBy('createdAt', 'desc')));
      const paymentsData = paymentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        paymentDate: doc.data().paymentDate?.toDate?.() || null,
        dueDate: doc.data().dueDate?.toDate?.() || null,
        createdAt: doc.data().createdAt?.toDate?.() || null,
      }));
      
      setUsers(usersData);
      setPlans(plansData);
      setPayments(paymentsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Error loading data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle URL parameters separately
  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const userId = queryParams.get('userId');
    
    if (userId && users.length > 0) {
      // Find and select the user
      const foundUser = users.find(u => u.id === userId);
      if (foundUser) {
        handleCollectPayment(foundUser);
      }
    }
  }, [location.search, users]);

  const handleCollectPayment = (user) => {
    setSelectedUser(user);
    setSelectedPlan(user.planId || '');
    setPaymentAmount(user.monthlyFee || 0);
    setActiveStep(0);
    setPaymentDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setPaymentDialogOpen(false);
    setSelectedUser(null);
    setSelectedPlan('');
    setActiveStep(0);
    setPaymentAmount(0);
  };

  const handlePlanSelect = (planId) => {
    const plan = plans.find(p => p.id === planId);
    if (plan) {
      setSelectedPlan(planId);
      setPaymentAmount(plan.price || 0);
      setActiveStep(1);
    }
  };

  const handlePaymentConfirm = async () => {
    if (!selectedUser || !selectedPlan) {
      toast.error('Please select a plan');
      return;
    }

    try {
      const plan = plans.find(p => p.id === selectedPlan);
      if (!plan) {
        toast.error('Selected plan not found');
        return;
      }

      // Calculate new end date
      const currentEndDate = selectedUser.planEndDate ? new Date(selectedUser.planEndDate) : new Date();
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + (plan.duration || 1));

      // Prepare update data with default values to avoid undefined
      const updateData = {
        planId: selectedPlan || '',
        planName: plan.name || '',
        planDuration: plan.duration || 1,
        monthlyFee: plan.price || 0,
        planEndDate: newEndDate,
        status: 'active',
        totalFeesPaid: (selectedUser.totalFeesPaid || 0) + (paymentAmount || 0),
        lastPaymentDate: new Date(),
        updatedAt: serverTimestamp(),
      };

      // Clean up undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          updateData[key] = '';
        }
      });

      // Update user document
      await updateDoc(doc(db, 'users', selectedUser.id), updateData);

      // Create payment record
      const paymentData = {
        userId: selectedUser.id || '',
        userName: selectedUser.name || '',
        planId: selectedPlan || '',
        planName: plan.name || '',
        amount: paymentAmount || 0,
        paymentDate: new Date(),
        dueDate: currentEndDate,
        monthNumber: (selectedUser.currentMonth || 0) + 1,
        status: 'paid',
        paymentType: 'renewal',
        notes: `Extended membership by ${plan.duration || 1} month(s)`,
        createdAt: serverTimestamp(),
      };

      // Clean up payment data
      Object.keys(paymentData).forEach(key => {
        if (paymentData[key] === undefined) {
          paymentData[key] = '';
        }
      });

      await addDoc(collection(db, 'payments'), paymentData);

      // Create or update subscription
      const subscriptionQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', selectedUser.id)
      );
      
      const subscriptionSnapshot = await getDocs(subscriptionQuery);
      
      const subscriptionData = {
        userId: selectedUser.id || '',
        userName: selectedUser.name || '',
        planId: selectedPlan || '',
        planName: plan.name || '',
        startDate: new Date(),
        endDate: newEndDate,
        amount: paymentAmount || 0,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Clean up subscription data
      Object.keys(subscriptionData).forEach(key => {
        if (subscriptionData[key] === undefined) {
          subscriptionData[key] = '';
        }
      });

      if (!subscriptionSnapshot.empty) {
        // Update existing subscription
        const subDoc = subscriptionSnapshot.docs[0];
        await updateDoc(doc(db, 'subscriptions', subDoc.id), {
          endDate: newEndDate,
          status: 'active',
          updatedAt: serverTimestamp(),
        });
      } else {
        // Create new subscription
        await addDoc(collection(db, 'subscriptions'), subscriptionData);
      }

      toast.success(`💰 Payment collected successfully! ${selectedUser.name}'s membership extended to ${newEndDate.toLocaleDateString('en-GB')}`);
      
      handleCloseDialog();
      fetchData();
      
      // Navigate to user list after success
      setTimeout(() => {
        navigate('/user-list');
      }, 2000);

    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error('Error processing payment');
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      if (isNaN(dateObj.getTime())) return 'Invalid Date';
      return dateObj.toLocaleDateString('en-GB');
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getExpiryStatus = (endDate) => {
    if (!endDate) return 'unknown';
    try {
      const today = new Date();
      const expiry = new Date(endDate);
      if (isNaN(expiry.getTime())) return 'unknown';
      
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) return 'expired';
      if (diffDays <= 3) return 'critical';
      if (diffDays <= 7) return 'warning';
      return 'active';
    } catch (error) {
      return 'unknown';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm);
    
    if (!matchesSearch) return false;
    
    const status = getExpiryStatus(user.planEndDate);
    
    if (filterStatus === 'expired') return status === 'expired';
    if (filterStatus === 'active') return status === 'active';
    if (filterStatus === 'warning') return status === 'warning' || status === 'critical';
    if (filterStatus === 'all') return true;
    
    return false;
  });

  const calculateStats = () => {
    const stats = {
      totalExpired: 0,
      totalActive: 0,
      totalRevenue: 0,
      pendingAmount: 0,
    };
    
    users.forEach(user => {
      const status = getExpiryStatus(user.planEndDate);
      if (status === 'expired') stats.totalExpired++;
      if (status === 'active') stats.totalActive++;
    });
    
    payments.forEach(payment => {
      if (payment.status === 'paid') {
        stats.totalRevenue += Number(payment.amount) || 0;
      }
    });
    
    // Calculate pending amount from expired users
    const expiredUsers = users.filter(user => getExpiryStatus(user.planEndDate) === 'expired');
    stats.pendingAmount = expiredUsers.reduce((sum, user) => sum + (Number(user.monthlyFee) || 0), 0);
    
    return stats;
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  const steps = ['Select Member', 'Choose Plan', 'Confirm Payment'];

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      {/* Header Section */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: { xs: 'flex-start', sm: 'center' }, 
        mb: 3, 
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 2 
      }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
            order: { xs: 2, sm: 1 }
          }}
        >
          Payment Management
        </Typography>
        
        <Badge 
          badgeContent={stats.totalExpired} 
          color="error" 
          showZero
          sx={{ order: { xs: 1, sm: 2 } }}
        >
          <Chip
            icon={<WarningIcon />}
            label={`${formatCurrency(stats.pendingAmount)} Pending`}
            color="error"
            variant="outlined"
            sx={{ 
              fontSize: { xs: '0.75rem', sm: '0.875rem' },
              '& .MuiChip-label': { px: { xs: 1, sm: 1.5 } }
            }}
          />
        </Badge>
      </Box>

      {/* Stats Cards - Mobile Stacked Layout */}
      <Grid container spacing={1.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'error.main', mb: 0.5 }}>
                {stats.totalExpired}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Expired Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main', mb: 0.5 }}>
                {stats.totalActive}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Active Members
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 0.5 }}>
                {formatCurrency(stats.totalRevenue)}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Total Revenue
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: { xs: 1.5, sm: 2 }, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'warning.main', mb: 0.5 }}>
                {formatCurrency(stats.pendingAmount)}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                Pending Collection
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3, p: { xs: 1.5, sm: 2 } }}>
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                sx: { fontSize: { xs: '0.875rem', sm: '1rem' } }
              }}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <FormControl fullWidth size="small">
              <InputLabel shrink sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                Filter by Status
              </InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="Filter by Status"
                sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
              >
                <MenuItem value="expired" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Expired Members</MenuItem>
                <MenuItem value="active" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Active Members</MenuItem>
                <MenuItem value="warning" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Expiring Soon</MenuItem>
                <MenuItem value="all" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>All Members</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<FilterIcon fontSize="small" />}
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('expired');
              }}
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                height: '40px'
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Members List */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
          <Typography 
            variant="h6" 
            gutterBottom 
            sx={{ 
              fontSize: { xs: '1rem', sm: '1.25rem' },
              display: 'flex', 
              alignItems: 'center', 
              gap: 1 
            }}
          >
            <PersonIcon fontSize="small" />
            Members Needing Payment
          </Typography>
          
          {/* Mobile Cards View */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
            {filteredUsers.map((user) => {
              const status = getExpiryStatus(user.planEndDate);
              const isExpired = status === 'expired';
              const daysUntil = Math.ceil((new Date(user.planEndDate) - new Date()) / (1000 * 60 * 60 * 24));
              
              return (
                <Card 
                  key={user.id}
                  variant="outlined"
                  sx={{
                    borderLeft: `4px solid ${
                      isExpired ? '#f44336' : 
                      status === 'critical' ? '#ff9800' : 
                      '#4caf50'
                    }`
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    {/* Header Row */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.light' }}>
                          <PersonIcon fontSize="small" />
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                            {user.name || 'No Name'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {user.phone || 'No Phone'}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        {isExpired ? (
                          <Chip 
                            label="Expired" 
                            color="error" 
                            size="small"
                            sx={{ mb: 1 }}
                          />
                        ) : status === 'critical' ? (
                          <Tooltip title={`Expires in ${daysUntil} days`}>
                            <Chip 
                              label="Expiring Soon" 
                              color="warning" 
                              size="small"
                              sx={{ mb: 1 }}
                            />
                          </Tooltip>
                        ) : (
                          <Chip 
                            label="Active" 
                            color="success" 
                            size="small"
                            variant="outlined"
                            sx={{ mb: 1 }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {/* Plan Info */}
                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Current Plan
                        </Typography>
                        <Chip 
                          label={user.planName || 'No Plan'} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        {formatCurrency(user.monthlyFee || 0)}/month
                      </Typography>
                    </Box>
                    
                    {/* Dates */}
                    <Grid container spacing={1} sx={{ mb: 2 }}>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          End Date
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon fontSize="small" color={isExpired ? 'error' : 'success'} />
                          <Typography variant="body2" fontSize="small" sx={{ color: isExpired ? 'error.main' : 'inherit' }}>
                            {formatDate(user.planEndDate)}
                          </Typography>
                        </Box>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          Last Payment
                        </Typography>
                        <Typography variant="body2" fontSize="small">
                          {formatDate(user.lastPaymentDate)}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    {/* Amount Due and Action */}
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      mt: 2 
                    }}>
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Amount Due
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(user.monthlyFee || 0)}
                        </Typography>
                      </Box>
                      <Button
                        variant="contained"
                        color={isExpired ? 'error' : 'primary'}
                        size="small"
                        startIcon={<PaymentIcon />}
                        onClick={() => handleCollectPayment(user)}
                        sx={{ 
                          fontSize: '0.75rem',
                          px: 2
                        }}
                      >
                        {isExpired ? 'Renew Now' : 'Collect'}
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              );
            })}
          </Box>
          
          {/* Desktop Table View */}
          <TableContainer 
            component={Paper} 
            sx={{ 
              maxHeight: 500, 
              borderRadius: 2,
              display: { xs: 'none', md: 'block' }
            }}
          >
            <Table stickyHeader size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Member</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Current Plan</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>End Date</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Status</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Amount Due</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Last Payment</TableCell>
                  <TableCell sx={{ fontSize: '0.875rem' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredUsers.map((user) => {
                  const status = getExpiryStatus(user.planEndDate);
                  const isExpired = status === 'expired';
                  const daysUntil = Math.ceil((new Date(user.planEndDate) - new Date()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <TableRow 
                      key={user.id} 
                      hover
                      sx={{
                        backgroundColor: isExpired ? 'rgba(244, 67, 54, 0.08)' : 
                                      status === 'critical' ? 'rgba(255, 152, 0, 0.08)' : 'inherit',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                            <PersonIcon fontSize="small" />
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                              {user.name || 'No Name'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {user.phone || 'No Phone'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.planName || 'No Plan'} 
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="textSecondary" display="block">
                          {formatCurrency(user.monthlyFee || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <CalendarIcon fontSize="small" color={isExpired ? 'error' : 'success'} />
                          <Typography variant="body2" sx={{ color: isExpired ? 'error.main' : 'inherit' }}>
                            {formatDate(user.planEndDate)}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {isExpired ? (
                          <Chip 
                            label="Expired" 
                            color="error" 
                            size="small"
                            icon={<WarningIcon />}
                          />
                        ) : status === 'critical' ? (
                          <Tooltip title={`Expires in ${daysUntil} days`}>
                            <Chip 
                              label="Expiring Soon" 
                              color="warning" 
                              size="small"
                            />
                          </Tooltip>
                        ) : status === 'warning' ? (
                          <Tooltip title={`Expires in ${daysUntil} days`}>
                            <Chip 
                              label="Expiring Soon" 
                              color="warning" 
                              size="small"
                            />
                          </Tooltip>
                        ) : (
                          <Chip 
                            label="Active" 
                            color="success" 
                            size="small"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                          {formatCurrency(user.monthlyFee || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(user.lastPaymentDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color={isExpired ? 'error' : 'primary'}
                          size="small"
                          startIcon={<PaymentIcon />}
                          onClick={() => handleCollectPayment(user)}
                        >
                          {isExpired ? 'Renew Now' : 'Collect'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <Alert 
              severity="success" 
              sx={{ 
                mt: 2,
                fontSize: { xs: '0.75rem', sm: '0.875rem' }
              }}
            >
              {filterStatus === 'expired' 
                ? 'No expired members found. Great job!' 
                : 'No members found matching your criteria.'}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Payment Dialog - Mobile Optimized */}
      <Dialog 
        open={paymentDialogOpen} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        fullScreen={isMobile}
      >
        <DialogTitle sx={{ 
          p: { xs: 2, sm: 3 },
          fontSize: { xs: '1rem', sm: '1.25rem' }
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PaymentIcon color="primary" fontSize={isMobile ? "small" : "medium"} />
            {selectedUser ? (
              <Box>
                <Typography variant="subtitle1">
                  Payment for {selectedUser.name}
                </Typography>
                {isMobile && (
                  <Typography variant="caption" color="textSecondary">
                    {selectedUser.phone || 'No Phone'}
                  </Typography>
                )}
              </Box>
            ) : 'Collect Payment'}
          </Box>
        </DialogTitle>
        
        <DialogContent sx={{ p: { xs: 2, sm: 3 } }}>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Stepper 
                activeStep={activeStep} 
                orientation={isMobile ? "vertical" : "vertical"}
                sx={{ 
                  '& .MuiStepLabel-root': { 
                    p: isMobile ? '8px 0' : '16px 0',
                    '& .MuiStepLabel-label': {
                      fontSize: isMobile ? '0.75rem' : '0.875rem'
                    }
                  }
                }}
              >
                {/* Step 1: Member Info */}
                <Step>
                  <StepLabel>Member Information</StepLabel>
                  <StepContent>
                    <Card variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                      <Grid container spacing={1.5}>
                        <Grid item xs={12}>
                          <Typography variant="subtitle2" color="textSecondary">
                            Current Status
                          </Typography>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                            <Box>
                              <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                                {selectedUser.name || 'No Name'}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {selectedUser.phone || 'No Phone'}
                              </Typography>
                            </Box>
                            {getExpiryStatus(selectedUser.planEndDate) === 'expired' ? (
                              <Chip label="Expired" color="error" size={isMobile ? "small" : "medium"} />
                            ) : (
                              <Chip label="Active" color="success" size={isMobile ? "small" : "medium"} variant="outlined" />
                            )}
                          </Box>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Current Plan
                          </Typography>
                          <Typography variant={isMobile ? "body2" : "body1"}>
                            {selectedUser.planName || 'No Plan'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Monthly Fee
                          </Typography>
                          <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                            {formatCurrency(selectedUser.monthlyFee || 0)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Current End Date
                          </Typography>
                          <Typography variant={isMobile ? "body2" : "body1"} sx={{ color: 'error.main' }}>
                            {formatDate(selectedUser.planEndDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="caption" color="textSecondary">
                            Total Paid
                          </Typography>
                          <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium' }}>
                            {formatCurrency(selectedUser.totalFeesPaid || 0)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Card>
                    <Button
                      variant="contained"
                      onClick={() => setActiveStep(1)}
                      endIcon={!isMobile && <ArrowForwardIcon />}
                      fullWidth={isMobile}
                      size={isMobile ? "small" : "medium"}
                      sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                    >
                      Continue to Plan Selection
                    </Button>
                  </StepContent>
                </Step>

                {/* Step 2: Plan Selection */}
                <Step>
                  <StepLabel>Select Plan</StepLabel>
                  <StepContent>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Choose a plan to extend membership:
                    </Typography>
                    
                    <Grid container spacing={1.5} sx={{ mt: 1 }}>
                      {plans.map((plan) => (
                        <Grid item xs={12} key={plan.id}>
                          <Card
                            variant="outlined"
                            sx={{ 
                              p: { xs: 1.5, sm: 2 }, 
                              cursor: 'pointer',
                              borderColor: selectedPlan === plan.id ? 'primary.main' : 'divider',
                              bgcolor: selectedPlan === plan.id ? 'black' : 'background.paper',
                              '&:hover': { borderColor: 'primary.main' }
                            }}
                            onClick={() => handlePlanSelect(plan.id)}
                          >
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant={isMobile ? "body2" : "subtitle1"} sx={{ fontWeight: 'medium' }}>
                                  {plan.name || 'Unnamed Plan'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  Duration: {plan.duration || 1} month{plan.duration > 1 ? 's' : ''}
                                </Typography>
                              </Box>
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant={isMobile ? "body1" : "h6"} sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                  {formatCurrency(plan.price || 0)}
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                  {plan.duration ? formatCurrency((plan.price || 0) / plan.duration) : formatCurrency(plan.price || 0)}/month
                                </Typography>
                              </Box>
                            </Box>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                    
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                      <Button 
                        onClick={() => setActiveStep(0)}
                        size={isMobile ? "small" : "medium"}
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        Back
                      </Button>
                      <Button
                        variant="contained"
                        onClick={() => setActiveStep(2)}
                        disabled={!selectedPlan}
                        endIcon={!isMobile && <ArrowForwardIcon />}
                        size={isMobile ? "small" : "medium"}
                        sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                      >
                        Continue to Payment
                      </Button>
                    </Box>
                  </StepContent>
                </Step>

                {/* Step 3: Payment Confirmation */}
                <Step>
                  <StepLabel>Confirm Payment</StepLabel>
                  <StepContent>
                    {selectedPlan && (
                      <>
                        <Card variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, mb: 2 }}>
                          <Typography variant={isMobile ? "body1" : "subtitle1"} gutterBottom sx={{ fontWeight: 'bold' }}>
                            Payment Summary
                          </Typography>
                          <Grid container spacing={1}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Member
                              </Typography>
                              <Typography variant={isMobile ? "body2" : "body1"}>
                                {selectedUser.name || 'No Name'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Selected Plan
                              </Typography>
                              <Typography variant={isMobile ? "body2" : "body1"}>
                                {plans.find(p => p.id === selectedPlan)?.name || 'No Plan'}
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Duration
                              </Typography>
                              <Typography variant={isMobile ? "body2" : "body1"}>
                                {(plans.find(p => p.id === selectedPlan)?.duration || 1)} months
                              </Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="textSecondary">
                                Amount
                              </Typography>
                              <Typography variant={isMobile ? "h6" : "h5"} sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                {formatCurrency(paymentAmount)}
                              </Typography>
                            </Grid>
                            <Grid item xs={12}>
                              <Divider sx={{ my: 1 }} />
                            </Grid>
                            <Grid item xs={12}>
                              <Typography variant="caption" color="textSecondary">
                                New End Date
                              </Typography>
                              <Typography variant={isMobile ? "body2" : "body1"} sx={{ fontWeight: 'medium', color: 'success.main' }}>
                                {(() => {
                                  const plan = plans.find(p => p.id === selectedPlan);
                                  const currentEndDate = selectedUser.planEndDate ? new Date(selectedUser.planEndDate) : new Date();
                                  const newEndDate = new Date(currentEndDate);
                                  newEndDate.setMonth(newEndDate.getMonth() + (plan?.duration || 1));
                                  return newEndDate.toLocaleDateString('en-GB');
                                })()}
                              </Typography>
                            </Grid>
                          </Grid>
                        </Card>
                        
                        <Alert severity="info" sx={{ mb: 2 }}>
                          <Typography variant={isMobile ? "caption" : "body2"}>
                            This payment will extend {selectedUser.name}'s membership by {plans.find(p => p.id === selectedPlan)?.duration || 1} month(s).
                          </Typography>
                        </Alert>
                        
                        <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                          <Button 
                            onClick={() => setActiveStep(1)}
                            size={isMobile ? "small" : "medium"}
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            Back
                          </Button>
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={handlePaymentConfirm}
                            startIcon={<CheckCircleIcon />}
                            size={isMobile ? "small" : "medium"}
                            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
                          >
                            Confirm & Process Payment
                          </Button>
                        </Box>
                      </>
                    )}
                  </StepContent>
                </Step>
              </Stepper>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={handleCloseDialog}
            size={isMobile ? "small" : "medium"}
            sx={{ fontSize: isMobile ? '0.75rem' : '0.875rem' }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default PaymentManagement;