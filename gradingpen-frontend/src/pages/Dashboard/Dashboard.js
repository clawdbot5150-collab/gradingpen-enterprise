import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  Assignment,
  TrendingUp,
  Schedule,
  CheckCircle,
  Warning,
  Group,
  Speed,
  AutoAwesome,
  ChevronRight,
  NotificationImportant,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

// Import API functions
import { getDashboardData, getRecentActivity, getPendingGrading } from '../../services/api';

const StatCard = ({ title, value, icon, color = 'primary', trend, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    <Card elevation={2}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
            {trend && (
              <Box display="flex" alignItems="center" mt={1}>
                <TrendingUp fontSize="small" color="success" />
                <Typography variant="body2" color="success.main" ml={0.5}>
                  {trend}
                </Typography>
              </Box>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}.light`, color: `${color}.dark` }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const Dashboard = () => {
  // Fetch dashboard data
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery(
    'dashboardData',
    getDashboardData,
    { refetchInterval: 5 * 60 * 1000 } // Refetch every 5 minutes
  );

  const { data: recentActivity, isLoading: activityLoading } = useQuery(
    'recentActivity',
    getRecentActivity
  );

  const { data: pendingGrading, isLoading: pendingLoading } = useQuery(
    'pendingGrading',
    getPendingGrading
  );

  // Sample data for charts (replace with real data)
  const gradingTrendData = dashboardData?.gradingTrend || [
    { date: '2024-01-01', completed: 45, pending: 12 },
    { date: '2024-01-02', completed: 52, pending: 8 },
    { date: '2024-01-03', completed: 38, pending: 15 },
    { date: '2024-01-04', completed: 61, pending: 5 },
    { date: '2024-01-05', completed: 49, pending: 10 },
    { date: '2024-01-06', completed: 67, pending: 3 },
    { date: '2024-01-07', completed: 55, pending: 7 },
  ];

  const subjectPerformanceData = dashboardData?.subjectPerformance || [
    { subject: 'English', avgScore: 78, color: '#1976d2' },
    { subject: 'Math', avgScore: 82, color: '#dc004e' },
    { subject: 'Science', avgScore: 75, color: '#2e7d32' },
    { subject: 'History', avgScore: 80, color: '#ed6c02' },
  ];

  const timeSavingsData = dashboardData?.timeSavings || [
    { name: 'Manual Grading', time: 120, color: '#ff6b6b' },
    { name: 'AI-Assisted', time: 25, color: '#4ecdc4' },
  ];

  if (dashboardLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <LinearProgress sx={{ width: '50%' }} />
      </Box>
    );
  }

  const stats = dashboardData?.stats || {
    totalAssignments: 24,
    pendingGrading: 8,
    studentsActive: 156,
    timeSaved: '12.5 hours',
    accuracyRate: '94%',
    avgGradingTime: '3.2 min'
  };

  return (
    <Box p={3}>
      {/* Welcome Section */}
      <Box mb={4}>
        <Typography variant="h3" gutterBottom>
          Welcome back, {dashboardData?.teacher?.name || 'Teacher'}!
        </Typography>
        <Typography variant="body1" color="textSecondary">
          Here's what's happening with your classes today.
        </Typography>
      </Box>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Total Assignments"
            value={stats.totalAssignments}
            icon={<Assignment />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Pending Grading"
            value={stats.pendingGrading}
            icon={<Schedule />}
            color="warning"
            subtitle="Awaiting review"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Active Students"
            value={stats.studentsActive}
            icon={<Group />}
            color="success"
            trend="+12% this week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Time Saved"
            value={stats.timeSaved}
            icon={<Speed />}
            color="info"
            subtitle="This week"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="AI Accuracy"
            value={stats.accuracyRate}
            icon={<AutoAwesome />}
            color="success"
            subtitle="vs human grading"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4} lg={2}>
          <StatCard
            title="Avg. Grade Time"
            value={stats.avgGradingTime}
            icon={<CheckCircle />}
            color="primary"
            subtitle="per assignment"
          />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Pending Actions */}
        <Grid item xs={12} md={4}>
          <Card elevation={2}>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <NotificationImportant color="warning" />
                <Typography variant="h6" ml={1}>
                  Pending Actions
                </Typography>
              </Box>
              
              {pendingLoading ? (
                <LinearProgress />
              ) : (
                <List dense>
                  {(pendingGrading || []).slice(0, 5).map((item, index) => (
                    <ListItem key={index} sx={{ px: 0 }}>
                      <ListItemIcon>
                        <Assignment fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={item.assignmentTitle}
                        secondary={`${item.submissionCount} submissions • Due ${format(parseISO(item.dueDate), 'MMM d')}`}
                      />
                      <IconButton size="small">
                        <ChevronRight />
                      </IconButton>
                    </ListItem>
                  ))}
                </List>
              )}
              
              <Button
                variant="outlined"
                fullWidth
                sx={{ mt: 2 }}
                startIcon={<Assignment />}
              >
                View All Assignments
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Grading Trend Chart */}
        <Grid item xs={12} md={8}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Grading Activity (Last 7 Days)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={gradingTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format(parseISO(date), 'MMM d')}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => format(parseISO(date), 'MMMM d, yyyy')}
                  />
                  <Bar dataKey="completed" fill="#2e7d32" name="Completed" />
                  <Bar dataKey="pending" fill="#ed6c02" name="Pending" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Subject Performance */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Subject Performance
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectPerformanceData} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="subject" type="category" />
                  <Tooltip formatter={(value) => [`${value}%`, 'Average Score']} />
                  <Bar dataKey="avgScore" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Time Savings Comparison */}
        <Grid item xs={12} md={6}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Time Savings Comparison
              </Typography>
              <Typography variant="body2" color="textSecondary" mb={2}>
                Average time per assignment (minutes)
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={timeSavingsData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="time"
                    label={({ name, time }) => `${name}: ${time}m`}
                  >
                    {timeSavingsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <Box mt={2}>
                <Typography variant="h5" color="success.main" align="center">
                  79% Time Saved
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  with AI-assisted grading
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card elevation={2}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              
              {activityLoading ? (
                <LinearProgress />
              ) : (
                <List>
                  {(recentActivity || []).slice(0, 6).map((activity, index) => (
                    <ListItem key={index} divider>
                      <ListItemIcon>
                        <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.light' }}>
                          {activity.type === 'grading' ? <CheckCircle /> : <Assignment />}
                        </Avatar>
                      </ListItemIcon>
                      <ListItemText
                        primary={activity.description}
                        secondary={`${activity.student} • ${format(parseISO(activity.timestamp), 'MMM d, h:mm a')}`}
                      />
                      <Chip
                        label={activity.subject}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;