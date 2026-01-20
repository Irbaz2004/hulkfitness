import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Chip,
  LinearProgress,
  Alert,
  Divider,
  Menu,
  MenuItem,
  CircularProgress,
  FormControl,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CurrencyRupee as MoneyIcon,
  CalendarToday as CalendarIcon,
  MoreVert as MoreVertIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, query, where, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';

function PlansManagement() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteInProgress, setDeleteInProgress] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    duration: 1,
    price: 0,
    isActive: true,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || null,
      })).sort((a, b) => a.duration - b.duration);
      
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error loading plans');
    } finally {
      setLoading(false);
    }
  };

  const handleMenuOpen = (event, plan) => {
    setAnchorEl(event.currentTarget);
    setSelectedPlan(plan);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    // Don't clear selectedPlan here, keep it for delete dialog
  };

  const handleEdit = () => {
    if (selectedPlan) {
      setEditingPlan(selectedPlan);
      setFormData({
        name: selectedPlan.name || '',
        description: selectedPlan.description || '',
        duration: selectedPlan.duration || 1,
        price: selectedPlan.price || 0,
        isActive: selectedPlan.isActive !== false,
      });
      setDialogOpen(true);
    }
    setAnchorEl(null);
  };

  const handleDelete = () => {
    if (selectedPlan) {
      setDeleteDialogOpen(true);
    }
    setAnchorEl(null);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedPlan) {
      toast.error('No plan selected for deletion');
      setDeleteDialogOpen(false);
      return;
    }

    setDeleteInProgress(true);
    
    try {
      // Check if any users are using this plan
      const usersQuery = query(collection(db, 'users'), where('planId', '==', selectedPlan.id));
      const usersSnapshot = await getDocs(usersQuery);
      
      if (!usersSnapshot.empty) {
        // Get user names for error message
        const userNames = usersSnapshot.docs.map(doc => doc.data().name).filter(name => name).join(', ');
        const count = usersSnapshot.size;
        toast.error(`Cannot delete plan. ${count} member(s) are still using this plan${userNames ? ': ' + userNames : ''}`);
        setDeleteInProgress(false);
        return;
      }

      // Check if any payments are associated with this plan
      const paymentsQuery = query(collection(db, 'payments'), where('planId', '==', selectedPlan.id));
      const paymentsSnapshot = await getDocs(paymentsQuery);
      
      if (!paymentsSnapshot.empty) {
        // Delete associated payments first
        const batch = writeBatch(db);
        paymentsSnapshot.docs.forEach(paymentDoc => {
          batch.delete(doc(db, 'payments', paymentDoc.id));
        });
        await batch.commit();
        toast.info(`Deleted ${paymentsSnapshot.size} associated payment records`);
      }

      // Check if any subscriptions are associated with this plan
      const subscriptionsQuery = query(collection(db, 'subscriptions'), where('planId', '==', selectedPlan.id));
      const subscriptionsSnapshot = await getDocs(subscriptionsQuery);
      
      if (!subscriptionsSnapshot.empty) {
        // Delete associated subscriptions
        const batch = writeBatch(db);
        subscriptionsSnapshot.docs.forEach(subDoc => {
          batch.delete(doc(db, 'subscriptions', subDoc.id));
        });
        await batch.commit();
        toast.info(`Deleted ${subscriptionsSnapshot.size} associated subscription records`);
      }

      // Delete the plan itself
      await deleteDoc(doc(db, 'plans', selectedPlan.id));
      
      toast.success(`Plan "${selectedPlan.name || 'Unknown'}" deleted successfully!`);
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
      await fetchPlans(); // Refresh the list
    } catch (error) {
      console.error('Error deleting plan:', error);
      
      // More specific error messages
      if (error.code === 'permission-denied') {
        toast.error('Permission denied. Check Firebase security rules.');
      } else if (error.code === 'not-found') {
        toast.error('Plan not found. It may have already been deleted.');
      } else {
        toast.error(`Error deleting plan: ${error.message}`);
      }
    } finally {
      setDeleteInProgress(false);
    }
  };

  const handleCloseDeleteDialog = () => {
    if (!deleteInProgress) {
      setDeleteDialogOpen(false);
      setSelectedPlan(null);
    }
  };

  const handleOpenDialog = () => {
    setEditingPlan(null);
    setFormData({
      name: '',
      description: '',
      duration: 1,
      price: 0,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPlan(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'duration' || name === 'price' ? Number(value) : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || formData.name.trim() === '') {
      toast.error('Please provide plan name');
      return;
    }

    if (formData.price <= 0) {
      toast.error('Please provide valid price');
      return;
    }

    if (formData.duration < 1) {
      toast.error('Duration must be at least 1 month');
      return;
    }

    try {
      const planData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        duration: formData.duration,
        price: formData.price,
        isActive: formData.isActive,
        monthlyRate: formData.price / formData.duration,
        updatedAt: serverTimestamp(),
      };

      // Ensure no undefined values
      Object.keys(planData).forEach(key => {
        if (planData[key] === undefined) {
          planData[key] = '';
        }
      });

      if (editingPlan) {
        // Update existing plan
        await updateDoc(doc(db, 'plans', editingPlan.id), planData);
        toast.success('Plan updated successfully!');
      } else {
        // Create new plan
        planData.createdAt = serverTimestamp();
        await addDoc(collection(db, 'plans'), planData);
        toast.success('Plan created successfully!');
      }

      handleCloseDialog();
      await fetchPlans();
    } catch (error) {
      console.error('Error saving plan:', error);
      toast.error('Error saving plan');
    }
  };

  const formatCurrency = (amount) => {
    const numAmount = Number(amount) || 0;
    return `₹${numAmount.toLocaleString('en-IN')}`;
  };

  const calculateMonthlyRate = (price, duration) => {
    if (!price || !duration || duration === 0) return 0;
    return price / duration;
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

  if (loading) {
    return (
      <Box sx={{ width: '100%', p: 3 }}>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{fontSize:{xs:20,md:30}}}>
          Membership Plans
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New Plan
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          Plans define the membership duration and pricing. When a member selects a plan, their membership end date is calculated by adding the plan duration to their join/renewal date.
        </Typography>
      </Alert>

      <Grid container spacing={3}>
        {plans.map((plan) => (
          <Grid item xs={12} md={6} lg={4} key={plan.id}>
            <Card sx={{ height: '100%', position: 'relative' }}>
              {plan.isActive === false && (
                <Chip
                  label="Inactive"
                  color="error"
                  size="small"
                  sx={{ position: 'absolute', top: 10, right: 10 }}
                />
              )}
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box>
                    <Typography variant="h5" gutterBottom sx={{ fontWeight: 'bold' }}>
                      {plan.name || 'Unnamed Plan'}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" paragraph>
                      {plan.description || 'No description'}
                    </Typography>
                  </Box>
                  <IconButton size="small" onClick={(e) => handleMenuOpen(e, plan)}>
                    <MoreVertIcon />
                  </IconButton>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <CalendarIcon color="primary" fontSize="small" />
                      <Typography variant="caption" color="textSecondary">
                        Duration
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
                      {plan.duration || 1} month{plan.duration > 1 ? 's' : ''}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MoneyIcon color="primary" fontSize="small" />
                      <Typography variant="caption" color="textSecondary">
                        Total Price
                      </Typography>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {formatCurrency(plan.price || 0)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <MoneyIcon color="success" fontSize="small" />
                      <Typography variant="caption" color="textSecondary">
                        Monthly Rate
                      </Typography>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {formatCurrency(calculateMonthlyRate(plan.price, plan.duration))}
                      <Typography component="span" variant="body2" color="textSecondary">
                        /month
                      </Typography>
                    </Typography>
                  </Grid>
                </Grid>

                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip
                    label={plan.isActive !== false ? 'Active' : 'Inactive'}
                    color={plan.isActive !== false ? 'success' : 'error'}
                    size="small"
                    icon={plan.isActive !== false ? <CheckCircleIcon /> : null}
                  />
                  <Typography variant="caption" color="textSecondary">
                    Created: {formatDate(plan.createdAt)}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {plans.length === 0 && (
        <Card sx={{ textAlign: 'center', py: 6, mt: 3 }}>
          <MoneyIcon sx={{ fontSize: 60, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="textSecondary" gutterBottom>
            No Plans Created Yet
          </Typography>
          <Typography variant="body2" color="textSecondary" paragraph>
            Create your first membership plan to start adding members.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Create Your First Plan
          </Button>
        </Card>
      )}

      {/* Plan Form Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPlan ? 'Edit Plan' : 'Create New Plan'}
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Plan Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  size="small"
                  helperText="Name of the membership plan"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  multiline
                  rows={2}
                  size="small"
                  helperText="Brief description of the plan"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Duration (months) *"
                  name="duration"
                  type="number"
                  value={formData.duration}
                  onChange={handleInputChange}
                  required
                  size="small"
                  InputProps={{ inputProps: { min: 1 } }}
                  helperText="Minimum 1 month"
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Total Price (₹) *"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  required
                  size="small"
                  InputProps={{ inputProps: { min: 0 } }}
                  helperText="Enter amount in ₹"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth size="small">
                  <TextField
                    select
                    label="Status"
                    name="isActive"
                    value={formData.isActive}
                    onChange={(e) => setFormData({...formData, isActive: e.target.value === 'true'})}
                    size="small"
                    helperText="Active plans can be selected by new members"
                  >
                    <MenuItem value={true}>Active</MenuItem>
                    <MenuItem value={false}>Inactive</MenuItem>
                  </TextField>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                {formData.duration > 0 && formData.price > 0 && (
                  <Alert severity="info" sx={{ mt: 1 }}>
                    <Typography variant="body2">
                      Monthly rate: <strong>{formatCurrency(formData.price / formData.duration)}/month</strong>
                    </Typography>
                    <Typography variant="caption">
                      Members will pay {formatCurrency(formData.price)} for {formData.duration} month{formData.duration > 1 ? 's' : ''} of membership.
                    </Typography>
                  </Alert>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              {editingPlan ? 'Update Plan' : 'Create Plan'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog 
        open={deleteDialogOpen} 
        onClose={handleCloseDeleteDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Confirm Deletion
          {selectedPlan?.name && `: ${selectedPlan.name}`}
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              ⚠️ Are you sure you want to delete "{selectedPlan?.name || 'this'}" plan?
            </Typography>
            <Typography variant="body2">
              This action cannot be undone. The system will check if any members are currently using this plan.
            </Typography>
            {selectedPlan && (
              <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="caption" display="block" gutterBottom>
                  <strong>Plan Details:</strong>
                </Typography>
                <Typography variant="caption" display="block">
                  • Name: {selectedPlan.name || 'Unknown'}
                </Typography>
                <Typography variant="caption" display="block">
                  • Duration: {selectedPlan.duration || 1} month{selectedPlan.duration > 1 ? 's' : ''}
                </Typography>
                <Typography variant="caption" display="block">
                  • Price: {formatCurrency(selectedPlan.price || 0)}
                </Typography>
                <Typography variant="caption" display="block">
                  • Status: {selectedPlan.isActive !== false ? 'Active' : 'Inactive'}
                </Typography>
                {selectedPlan.description && (
                  <Typography variant="caption" display="block">
                    • Description: {selectedPlan.description}
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={handleCloseDeleteDialog}
            disabled={deleteInProgress}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={deleteInProgress}
            startIcon={deleteInProgress ? <CircularProgress size={20} color="inherit" /> : <DeleteIcon />}
          >
            {deleteInProgress ? 'Deleting...' : 'Delete Plan'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem onClick={handleEdit}>
          <EditIcon sx={{ mr: 1, fontSize: 20 }} />
          Edit Plan
        </MenuItem>
        <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
          <DeleteIcon sx={{ mr: 1, fontSize: 20 }} />
          Delete Plan
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default PlansManagement;