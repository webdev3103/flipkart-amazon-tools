import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress
} from '@mui/material';
import {
  ErrorOutline,
  Speed,
  Analytics,
  Refresh,
  DeleteOutline,
  VisibilityOutlined,
  TrendingUp
} from '@mui/icons-material';
import monitoringService, { ErrorReport, PerformanceMetrics, UserAnalytics } from '../../services/monitoring.service';
import { formatDistanceToNow } from 'date-fns';
import { useIsMobile } from '../../utils/mobile';
import { MobileAppShell } from '../../navigation/MobileAppShell';

interface MonitoringStats {
  errorCount: number;
  avgPerformance: number;
  sessionCount: number;
  criticalErrors: number;
}

const MonitoringDashboard: React.FC = () => {
  const isMobile = useIsMobile();
  const [errors, setErrors] = useState<ErrorReport[]>([]);
  const [performance, setPerformance] = useState<PerformanceMetrics[]>([]);
  const [analytics, setAnalytics] = useState<UserAnalytics[]>([]);
  const [stats, setStats] = useState<MonitoringStats>({
    errorCount: 0,
    avgPerformance: 0,
    sessionCount: 0,
    criticalErrors: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [selectedErrorDetails, setSelectedErrorDetails] = useState<ErrorReport | null>(null);

  useEffect(() => {
    loadMonitoringData();
  }, [selectedTimeRange]);

  const loadMonitoringData = (): void => {
    setLoading(true);
    
    try {
      const errorData = monitoringService.getStoredErrors();
      const performanceData = monitoringService.getStoredPerformanceMetrics();
      const analyticsData = monitoringService.getStoredAnalytics();

      // Filter by time range
      const timeRangeMs = getTimeRangeMs(selectedTimeRange);
      const now = Date.now();
      
      const filteredErrors = errorData.filter(error => 
        now - new Date(error.timestamp).getTime() <= timeRangeMs
      );
      
      const filteredPerformance = performanceData.filter(metric => 
        now - new Date(metric.timestamp).getTime() <= timeRangeMs
      );
      
      const filteredAnalytics = analyticsData.filter(event => 
        now - new Date(event.timestamp).getTime() <= timeRangeMs
      );

      setErrors(filteredErrors);
      setPerformance(filteredPerformance);
      setAnalytics(filteredAnalytics);

      // Calculate stats
      const uniqueSessions = new Set([
        ...filteredErrors.map(e => e.sessionId),
        ...filteredPerformance.map(p => p.sessionId),
        ...filteredAnalytics.map(a => a.sessionId)
      ]);

      const avgPageLoad = filteredPerformance.length > 0
        ? filteredPerformance.reduce((sum, p) => sum + p.metrics.pageLoadTime, 0) / filteredPerformance.length
        : 0;

      setStats({
        errorCount: filteredErrors.length,
        avgPerformance: avgPageLoad,
        sessionCount: uniqueSessions.size,
        criticalErrors: filteredErrors.filter(e => e.severity === 'critical').length
      });

    } catch (error) {
      console.error('Failed to load monitoring data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeRangeMs = (range: string): number => {
    switch (range) {
      case '1h': return 60 * 60 * 1000;
      case '6h': return 6 * 60 * 60 * 1000;
      case '24h': return 24 * 60 * 60 * 1000;
      case '7d': return 7 * 24 * 60 * 60 * 1000;
      case '30d': return 30 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000;
    }
  };

  const getSeverityColor = (severity: string): "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" => {
    switch (severity) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const clearAllData = (): void => {
    monitoringService.clearStoredData();
    loadMonitoringData();
  };

  const getPerformanceRating = (time: number): { rating: string; color: string } => {
    if (time < 1000) return { rating: 'Excellent', color: 'success.main' };
    if (time < 2500) return { rating: 'Good', color: 'info.main' };
    if (time < 4000) return { rating: 'Fair', color: 'warning.main' };
    return { rating: 'Poor', color: 'error.main' };
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  const content = (
    <Box sx={{ padding: isMobile ? 2 : 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
        <Typography variant="h4" gutterBottom>
          Monitoring Dashboard
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Time Range</InputLabel>
            <Select
              value={selectedTimeRange}
              label="Time Range"
              onChange={(e) => setSelectedTimeRange(e.target.value)}
            >
              <MenuItem value="1h">Last Hour</MenuItem>
              <MenuItem value="6h">Last 6 Hours</MenuItem>
              <MenuItem value="24h">Last 24 Hours</MenuItem>
              <MenuItem value="7d">Last 7 Days</MenuItem>
              <MenuItem value="30d">Last 30 Days</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={loadMonitoringData}
          >
            Refresh
          </Button>
          
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteOutline />}
            onClick={clearAllData}
          >
            Clear Data
          </Button>
        </Box>
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ marginBottom: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Errors
                  </Typography>
                  <Typography variant="h4">
                    {stats.errorCount}
                  </Typography>
                </Box>
                <ErrorOutline sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
              {stats.criticalErrors > 0 && (
                <Alert severity="error" sx={{ marginTop: 1 }}>
                  {stats.criticalErrors} critical errors detected!
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Avg Page Load
                  </Typography>
                  <Typography variant="h4">
                    {Math.round(stats.avgPerformance)}ms
                  </Typography>
                  <Typography variant="body2" sx={{ color: getPerformanceRating(stats.avgPerformance).color }}>
                    {getPerformanceRating(stats.avgPerformance).rating}
                  </Typography>
                </Box>
                <Speed sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Active Sessions
                  </Typography>
                  <Typography variant="h4">
                    {stats.sessionCount}
                  </Typography>
                </Box>
                <Analytics sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Events Tracked
                  </Typography>
                  <Typography variant="h4">
                    {analytics.length}
                  </Typography>
                </Box>
                <TrendingUp sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Recent Errors */}
      <Grid container spacing={3}>
        <Grid item xs={12} lg={8}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Errors
            </Typography>
            
            {errors.length === 0 ? (
              <Alert severity="success">No errors detected in the selected time range.</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Severity</TableCell>
                      <TableCell>Message</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {errors.slice(0, 10).map((error) => (
                      <TableRow key={error.id}>
                        <TableCell>
                          <Chip
                            label={error.severity.toUpperCase()}
                            color={getSeverityColor(error.severity)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 300 }}>
                            {error.message.substring(0, 100)}
                            {error.message.length > 100 ? '...' : ''}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDistanceToNow(new Date(error.timestamp), { addSuffix: true })}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedErrorDetails(error)}
                            >
                              <VisibilityOutlined />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Paper sx={{ padding: 3 }}>
            <Typography variant="h6" gutterBottom>
              Performance Metrics
            </Typography>
            
            {performance.length === 0 ? (
              <Alert severity="info">No performance data available.</Alert>
            ) : (
                             <Box>
                 {performance.slice(0, 5).map((metric) => {
                   const rating = getPerformanceRating(metric.metrics.pageLoadTime);
                   return (
                    <Box key={metric.id} sx={{ marginBottom: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          Load Time: {Math.round(metric.metrics.pageLoadTime)}ms
                        </Typography>
                        <Chip
                          label={rating.rating}
                          size="small"
                          sx={{ backgroundColor: rating.color, color: 'white' }}
                        />
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={Math.min((metric.metrics.pageLoadTime / 5000) * 100, 100)}
                        sx={{ marginTop: 0.5 }}
                      />
                      <Typography variant="caption" color="textSecondary">
                        {formatDistanceToNow(new Date(metric.timestamp), { addSuffix: true })}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Error Details Modal (simplified for demo) */}
      {selectedErrorDetails && (
        <Paper sx={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                    width: '80%', maxWidth: 800, maxHeight: '80%', overflow: 'auto', padding: 3, zIndex: 1300 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
            <Typography variant="h6">Error Details</Typography>
            <Button onClick={() => setSelectedErrorDetails(null)}>Close</Button>
          </Box>
          
          <Typography variant="body2" component="pre" sx={{ 
            backgroundColor: 'grey.100', 
            padding: 2, 
            borderRadius: 1,
            fontSize: '0.8rem',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word'
          }}>
            {JSON.stringify(selectedErrorDetails, null, 2)}
          </Typography>
        </Paper>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <MobileAppShell pageTitle="Monitoring">
        {content}
      </MobileAppShell>
    );
  }

  return content;
};

export default MonitoringDashboard; 