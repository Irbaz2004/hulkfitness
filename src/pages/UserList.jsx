import React, { useState, useEffect } from 'react';
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
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
  Avatar,
  LinearProgress,
  Divider,
  Grid,
  Tooltip,
  Badge,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  MoreVert as MoreVertIcon,
  Payment as PaymentIcon,
  Person as PersonIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  CalendarToday as CalendarIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { collection, getDocs, doc, deleteDoc, query, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

function UserList() {
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [expiredUsers, setExpiredUsers] = useState([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersSnapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
      const usersData = usersSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        joinDate: doc.data().joinDate?.toDate?.() || new Date(),
        planEndDate: doc.data().planEndDate?.toDate?.() || null,
      }));
      
      // Calculate expired users
      const today = new Date();
      const expired = usersData.filter(user => 
        user.planEndDate && new Date(user.planEndDate) < today
      );
      
      setUsers(usersData);
      setExpiredUsers(expired);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error fetching users');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, user) => {
    setAnchorEl(event.currentTarget);
    setSelectedUser(user);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedUser) {
      toast.error('No user selected for deletion');
      setDeleteDialogOpen(false);
      return;
    }

    try {
      // Delete user
      await deleteDoc(doc(db, 'users', selectedUser.id));
      
      // Also delete associated payments
      const paymentsQuery = query(
        collection(db, 'payments'),
        where('userId', '==', selectedUser.id)
      );
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      const deletePromises = paymentsSnapshot.docs.map(paymentDoc => 
        deleteDoc(doc(db, 'payments', paymentDoc.id))
      );
      
      // Delete subscriptions
      const subscriptionsQuery = query(
        collection(db, 'subscriptions'),
        where('userId', '==', selectedUser.id)
      );
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      
      subscriptionsSnapshot.docs.forEach(subDoc => {
        deletePromises.push(deleteDoc(doc(db, 'subscriptions', subDoc.id)));
      });
      
      await Promise.all(deletePromises);
      
      toast.success('User deleted successfully!');
      setDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error deleting user');
    }
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setSelectedUser(null);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.includes(searchTerm) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const today = new Date();
    const isActive = user.planEndDate && new Date(user.planEndDate) >= today;
    
    if (filterStatus === 'active') return matchesSearch && isActive;
    if (filterStatus === 'expired') return matchesSearch && !isActive;
    
    return matchesSearch;
  });

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

  const getExpiryStatus = (endDate) => {
    if (!endDate) return 'unknown';
    const days = getDaysUntilExpiry(endDate);
    if (days < 0) return 'expired';
    if (days <= 3) return 'critical';
    if (days <= 7) return 'warning';
    return 'active';
  };

  const getExpiryChip = (endDate) => {
    const status = getExpiryStatus(endDate);
    const days = getDaysUntilExpiry(endDate);
    
    if (!endDate) {
      return <Chip label="No end date" size="small" variant="outlined" />;
    }
    
    if (status === 'expired') {
      return (
        <Tooltip title={`Expired ${Math.abs(days)} days ago`}>
          <Chip 
            label="Expired" 
            color="error" 
            size="small"
            icon={<WarningIcon />}
          />
        </Tooltip>
      );
    } else if (status === 'critical') {
      return (
        <Tooltip title={`Expires in ${days} days`}>
          <Chip 
            label={`Expires in ${days}d`} 
            color="error" 
            size="small"
          />
        </Tooltip>
      );
    } else if (status === 'warning') {
      return (
        <Tooltip title={`Expires in ${days} days`}>
          <Chip 
            label={`Expires: ${formatDate(endDate)}`} 
            color="warning" 
            size="small"
            variant="outlined"
          />
        </Tooltip>
      );
    } else {
      return (
        <Tooltip title={`Expires on ${formatDate(endDate)}`}>
          <Chip 
            label="Active" 
            color="success" 
            size="small"
            icon={<CheckCircleIcon />}
            variant="outlined"
          />
        </Tooltip>
      );
    }
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
        order: { xs: 2, sm: 1 },
        width: { xs: '100%', sm: 'auto' }
      }}
    >
      Members List
    </Typography>
    
    <Box sx={{ 
      display: 'flex', 
      gap: 1, 
      flexWrap: 'wrap',
      width: { xs: '100%', sm: 'auto' },
      order: { xs: 1, sm: 2 }
    }}>
      <Badge badgeContent={expiredUsers.length} color="error" showZero>
        <Chip
          icon={<WarningIcon />}
          label="Expired"
          color="error"
          variant="outlined"
          onClick={() => setFilterStatus('expired')}
          sx={{ 
            cursor: 'pointer',
            fontSize: { xs: '0.75rem', sm: '0.875rem' }
          }}
        />
      </Badge>
      
      <Button
        variant="contained"
        color="primary"
        component={Link}
        to="/add-user"
        startIcon={<PersonIcon />}
        fullWidth
        sx={{ 
          minWidth: { xs: '100%', sm: 'auto' },
          fontSize: { xs: '0.75rem', sm: '0.875rem' }
        }}
      >
        Add New Member
      </Button>
    </Box>
  </Box>
  
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
          }}
        />
      </Grid>
      <Grid item xs={12} sm={6}>
        <FormControl fullWidth size="small">
          <InputLabel shrink sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            Status Filter
          </InputLabel>
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            label="Status Filter"
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
          >
            <MenuItem value="all" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>All Members</MenuItem>
            <MenuItem value="active" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Active Only</MenuItem>
            <MenuItem value="expired" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>Expired Only</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Button
          fullWidth
          variant="outlined"
          startIcon={<FilterIcon />}
          onClick={() => {
            setSearchTerm('');
            setFilterStatus('all');
          }}
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
        >
          Clear Filters
        </Button>
      </Grid>
    </Grid>
  </Card>
  
  {/* Alert */}
  {expiredUsers.length > 0 && filterStatus === 'all' && (
    <Alert 
      severity="error" 
      sx={{ 
        mb: 3,
        fontSize: { xs: '0.75rem', sm: '0.875rem' },
        '& .MuiAlert-icon': { fontSize: { xs: '1rem', sm: '1.25rem' } }
      }}
    >
      <Typography variant="subtitle2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
        ⚠️ {expiredUsers.length} member{expiredUsers.length > 1 ? 's have' : ' has'} expired membership.
        Collect payment to renew their membership.
      </Typography>
    </Alert>
  )}
  
  {/* Table Section */}
  <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
    <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
      {/* Mobile Cards View for XS screens */}
      <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2 }}>
        {filteredUsers.map((user) => {
          const isExpired = getExpiryStatus(user.planEndDate) === 'expired';
          
          return (
            <Card 
              key={user.id}
              variant="outlined"
              sx={{
                borderLeft: `4px solid ${isExpired ? '#f44336' : '#4caf50'}`,
                backgroundColor: isExpired ? 'rgba(244, 67, 54, 0.04)' : 'inherit'
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
                        ID: {user.id.substring(0, 6)}...
                      </Typography>
                    </Box>
                  </Box>
                  <IconButton 
                    size="small"
                    onClick={(e) => handleMenuOpen(e, user)}
                  >
                    <MoreVertIcon />
                  </IconButton>
                </Box>
                
                {/* Contact Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Contact
                  </Typography>
                  <Typography variant="body2">{user.phone || 'No Phone'}</Typography>
                  {user.email && (
                    <Typography variant="caption" color="text.secondary">
                      {user.email}
                    </Typography>
                  )}
                </Box>
                
                {/* Plan Info */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                    Plan
                  </Typography>
                  <Chip 
                    label={user.planName || 'No Plan'} 
                    color="primary"
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    {formatCurrency(user.monthlyFee || 0)}/month
                  </Typography>
                </Box>
                
                {/* Dates and Status */}
                <Grid container spacing={1} sx={{ mb: 2 }}>
                  <Grid item xs={6}>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      Join Date
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2" fontSize="small">
                        {formatDate(user.joinDate)}
                      </Typography>
                    </Box>
                  </Grid>
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
                </Grid>
                
                {/* Status and Total Paid */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>{getExpiryChip(user.planEndDate)}</Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Paid
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(user.totalFeesPaid || 0)}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
      
      {/* Desktop Table View for MD screens and above */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          maxHeight: 600, 
          borderRadius: 2,
          display: { xs: 'none', md: 'block' }
        }}
      >
        <Table stickyHeader size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontSize: '0.875rem' }}>Member</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>Contact</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>Plan</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>Join Date</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>End Date</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>Status</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>Total Paid</TableCell>
              <TableCell sx={{ fontSize: '0.875rem' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => {
              const isExpired = getExpiryStatus(user.planEndDate) === 'expired';
              
              return (
                <TableRow 
                  key={user.id} 
                  hover
                  sx={{
                    backgroundColor: isExpired ? 'rgba(244, 67, 54, 0.08)' : 'inherit',
                    '&:hover': {
                      backgroundColor: isExpired ? 'rgba(244, 67, 54, 0.12)' : 'rgba(0, 0, 0, 0.04)',
                    }
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
                      
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.phone || 'No Phone'}</Typography>
                    {user.email && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {user.email}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Chip 
                        label={user.planName || 'No Plan'} 
                        color="primary"
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" color="text.secondary" display="block">
                        {formatCurrency(user.monthlyFee || 0)}/month
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CalendarIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {formatDate(user.joinDate)}
                      </Typography>
                    </Box>
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
                    {getExpiryChip(user.planEndDate)}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                      {formatCurrency(user.totalFeesPaid || 0)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, user)}
                      sx={{ 
                        backgroundColor: 'action.hover',
                        '&:hover': { backgroundColor: 'action.selected' }
                      }}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Empty State */}
      {filteredUsers.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <PersonIcon sx={{ fontSize: { xs: 40, sm: 60 }, color: 'text.disabled', mb: 2 }} />
          <Typography color="textSecondary" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
            {searchTerm || filterStatus !== 'all' 
              ? 'No members found matching your filters' 
              : 'No members found. Add your first member!'}
          </Typography>
        </Box>
      )}
    </CardContent>
  </Card>

  {/* Action Menu */}
  <Menu
    anchorEl={anchorEl}
    open={Boolean(anchorEl)}
    onClose={handleMenuClose}
    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    PaperProps={{
      sx: { minWidth: 200 }
    }}
  >
    <MenuItem 
      component={Link} 
      to={`/payment-management?userId=${selectedUser?.id}`} 
      onClick={handleMenuClose}
      sx={{ fontSize: '0.875rem' }}
    >
      <PaymentIcon sx={{ mr: 1.5, fontSize: 20 }} />
      Collect/Renew Payment
    </MenuItem>
    <Divider />
    <MenuItem 
      onClick={handleDelete} 
      sx={{ color: 'error.main', fontSize: '0.875rem' }}
    >
      <DeleteIcon sx={{ mr: 1.5, fontSize: 20 }} />
      Delete Member
    </MenuItem>
  </Menu>

  {/* Delete Dialog */}
  <Dialog 
    open={deleteDialogOpen} 
    onClose={handleCloseDeleteDialog}
    fullScreen
    maxWidth="sm"
    fullWidth
  >
    <DialogTitle sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
      Confirm Deletion
    </DialogTitle>
    <DialogContent>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
          Are you sure you want to delete {selectedUser?.name}?
        </Typography>
        <Typography variant="body2" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
          This action will permanently delete the member and all associated payment records.
        </Typography>
      </Alert>
    </DialogContent>
    <DialogActions sx={{ p: 2 }}>
      <Button 
        onClick={handleCloseDeleteDialog}
        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
      >
        Cancel
      </Button>
      <Button 
        onClick={handleDeleteConfirm} 
        variant="contained" 
        color="error"
        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
      >
        Delete Permanently
      </Button>
    </DialogActions>
  </Dialog>
</Box>
  );
}

export default UserList;