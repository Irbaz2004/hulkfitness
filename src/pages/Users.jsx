import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  LinearProgress,
  Divider,
  Paper,
  Chip,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  CalendarToday as CalendarIcon,
  CurrencyRupee as MoneyIcon,
} from '@mui/icons-material';
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

function AddUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    joinDate: new Date().toISOString().split('T')[0],
    planId: '',
    planName: '',
    planDuration: 1,
    planPrice: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    calculatePlanDetails();
  }, [formData.planId]);

  const fetchPlans = async () => {
    try {
      const plansSnapshot = await getDocs(collection(db, 'plans'));
      const plansData = plansSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPlans(plansData);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Error loading plans');
    }
  };

  const calculatePlanDetails = () => {
    if (!formData.planId) return;
    
    const selectedPlan = plans.find(plan => plan.id === formData.planId);
    if (selectedPlan) {
      const planEndDate = new Date(formData.joinDate);
      planEndDate.setMonth(planEndDate.getMonth() + selectedPlan.duration);
      
      setFormData(prev => ({
        ...prev,
        planName: selectedPlan.name,
        planDuration: selectedPlan.duration,
        planPrice: selectedPlan.price,
        totalAmount: selectedPlan.price,
        planEndDate: planEndDate.toISOString().split('T')[0],
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.planId) {
      toast.error('Please select a plan');
      return;
    }

    if (!formData.name || !formData.phone) {
      toast.error('Name and phone are required');
      return;
    }

    setLoading(true);

    try {
      const selectedPlan = plans.find(plan => plan.id === formData.planId);
      const joinDate = new Date(formData.joinDate);
      const planEndDate = new Date(joinDate);
      planEndDate.setMonth(planEndDate.getMonth() + selectedPlan.duration);

      // Create user document
      const userData = {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        joinDate: joinDate,
        planId: formData.planId,
        planName: selectedPlan.name,
        planDuration: selectedPlan.duration,
        monthlyFee: selectedPlan.price,
        planEndDate: planEndDate,
        status: 'active',
        totalFeesPaid: selectedPlan.price,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const userRef = await addDoc(collection(db, 'users'), userData);

      // Create initial payment record
      const paymentData = {
        userId: userRef.id,
        userName: formData.name.trim(),
        planName: selectedPlan.name,
        planId: formData.planId,
        amount: selectedPlan.price,
        paymentDate: new Date(),
        dueDate: joinDate,
        monthNumber: 1,
        status: 'paid',
        paymentType: 'initial',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'payments'), paymentData);

      // Create subscription record
      const subscriptionData = {
        userId: userRef.id,
        userName: formData.name.trim(),
        planId: formData.planId,
        planName: selectedPlan.name,
        startDate: joinDate,
        endDate: planEndDate,
        amount: selectedPlan.price,
        status: 'active',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'subscriptions'), subscriptionData);

      toast.success(`🎉 Member ${formData.name} added successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        phone: '',
        joinDate: new Date().toISOString().split('T')[0],
        planId: '',
        planName: '',
        planDuration: 1,
        planPrice: 0,
        totalAmount: 0,
      });

      // Navigate to user list
      setTimeout(() => {
        navigate('/user-list');
      }, 1500);

    } catch (error) {
      console.error('Error adding user:', error);
      toast.error('Error adding user');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${amount?.toLocaleString('en-IN') || '0'}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 3 ,fontSize:{xs:20, md:30}}} >
        <PersonAddIcon sx={{ verticalAlign: 'middle', mr: 2 }} />
        Add New Member
      </Typography>

      <Card sx={{ borderRadius: 3 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Personal Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonAddIcon />
                  Personal Information
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name *"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  size="small"
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Phone Number *"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  size="small"
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>

           

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Join Date"
                  name="joinDate"
                  type="date"
                  value={formData.joinDate}
                  onChange={handleInputChange}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

             
              {/* Plan Selection */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                  <MoneyIcon />
                  Membership Plan
                </Typography>
                <Divider sx={{ mb: 2 }} />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth size="small" required>
                  <InputLabel>Select Plan *</InputLabel>
                  <Select
                    name="planId"
                    value={formData.planId}
                    onChange={handleInputChange}
                    label="Select Plan *"
                  >
                    <MenuItem value="">
                      <em>Select a plan</em>
                    </MenuItem>
                    {plans.map((plan) => (
                      <MenuItem key={plan.id} value={plan.id}>
                        {plan.name} - {formatCurrency(plan.price)} ({plan.duration} month{plan.duration > 1 ? 's' : ''})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Plan Summary */}
              {formData.planId && (
                <>
                  <Grid item xs={12}>
                    <Paper variant="outlined" sx={{ p: 3, bgcolor: 'background.default' }}>
                      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Plan Summary
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Plan Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formData.planName}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Duration
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formData.planDuration} month{formData.planDuration > 1 ? 's' : ''}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Plan Price
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'primary.main' }}>
                            {formatCurrency(formData.planPrice)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={3}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            Total Amount
                          </Typography>
                          <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                            {formatCurrency(formData.totalAmount)}
                          </Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                        </Grid>
                        <Grid item xs={6} md={6}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            Join Date
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium' }}>
                            {formatDate(formData.joinDate)}
                          </Typography>
                        </Grid>
                        <Grid item xs={6} md={6}>
                          <Typography variant="caption" color="textSecondary" display="block">
                            <CalendarIcon sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                            Plan End Date
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 'medium', color: 'success.main' }}>
                            {formatDate(formData.planEndDate)}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>

                  <Grid item xs={12}>
                    <Alert severity="info" sx={{ mb: 2 }}>
                      <Typography variant="body2">
                        The member's plan will be active from <strong>{formatDate(formData.joinDate)}</strong> to <strong>{formatDate(formData.planEndDate)}</strong>.
                        After this period, the membership will expire and require renewal.
                      </Typography>
                    </Alert>
                  </Grid>
                </>
              )}

              {/* Action Buttons */}
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/user-list')}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={loading || !formData.planId}
                    startIcon={<PersonAddIcon />}
                  >
                    {loading ? 'Adding Member...' : 'Add Member'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>

          {loading && (
            <Box sx={{ mt: 3 }}>
              <LinearProgress />
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default AddUser;