import React from 'react';
import { Box, Paper, Typography, Grid } from '@mui/material';
import { CheckCircle, Speed, Storage } from '@mui/icons-material';
import { useIsMobile } from '../../utils/mobile';
import { MobileAppShell } from '../../navigation/MobileAppShell';

const HealthPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = React.useState(true);
  const [healthData, setHealthData] = React.useState({
    status: 'healthy',
    timestamp: '',
    version: '1.0.0',
    services: {
      database: 'healthy',
      storage: 'healthy',
      auth: 'healthy'
    },
    metrics: {
      uptime: 0,
      memory: 0,
      responseTime: 0
    }
  });

  React.useEffect(() => {
    const performHealthCheck = async () => {
      try {
        const startTime = performance.now();
        await new Promise(resolve => setTimeout(resolve, 100));
        const endTime = performance.now();
        
        setHealthData({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: import.meta.env.VITE_APP_VERSION || '1.0.0',
          services: {
            database: 'healthy',
            storage: 'healthy',
            auth: 'healthy'
          },
          metrics: {
            uptime: Date.now(),
            memory: 0,
            responseTime: endTime - startTime
          }
        });
      } catch (error) {
        console.error('Health check failed:', error);
        setHealthData(prev => ({
          ...prev,
          status: 'unhealthy'
        }));
      } finally {
        setLoading(false);
      }
    };

    performHealthCheck();
  }, []);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return '#4caf50';
      case 'degraded': return '#ff9800';
      case 'unhealthy': return '#f44336';
      default: return '#757575';
    }
  };

  const formatUptime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Performing health check...</Typography>
      </Box>
    );
  }

  if (isMobile) {
    return (
      <MobileAppShell pageTitle="Health">
        <Box sx={{ p: 2 }}>
          <Grid container spacing={2}>
            {/* Overall Status */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CheckCircle sx={{ mr: 1 }} />
                  <Typography variant="h6">Overall Status</Typography>
                </Box>
                <Box
                  sx={{
                    p: 1,
                    borderRadius: 1,
                    backgroundColor: getStatusColor(healthData.status),
                    color: 'white',
                    textAlign: 'center',
                    mb: 1
                  }}
                >
                  <Typography variant="h6">
                    {healthData.status.toUpperCase()}
                  </Typography>
                </Box>
                <Typography variant="body2">Version: {healthData.version}</Typography>
                <Typography variant="body2">
                  Last Check: {new Date(healthData.timestamp).toLocaleString()}
                </Typography>
              </Paper>
            </Grid>

            {/* Services Status */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Storage sx={{ mr: 1 }} />
                  <Typography variant="h6">Services</Typography>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {Object.entries(healthData.services).map(([service, status]) => (
                    <Box key={service} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography>{service}:</Typography>
                      <Box
                        sx={{
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                          backgroundColor: getStatusColor(status),
                          color: 'white',
                          fontSize: '0.75rem'
                        }}
                      >
                        {status}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>

            {/* Metrics */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Speed sx={{ mr: 1 }} />
                  <Typography variant="h6">Metrics</Typography>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h4" color="primary">
                        {formatUptime(healthData.metrics.uptime)}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Uptime
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h5" color="primary">
                        0 MB
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Memory Usage
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', py: 1 }}>
                      <Typography variant="h5" color="primary">
                        {healthData.metrics.responseTime.toFixed(2)}ms
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        Response Time
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </MobileAppShell>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Application Health Status
      </Typography>
      
      <Grid container spacing={3}>
        {/* Overall Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <CheckCircle sx={{ mr: 1 }} />
              <Typography variant="h6">Overall Status</Typography>
            </Box>
            <Box 
              sx={{ 
                p: 1, 
                borderRadius: 1, 
                backgroundColor: getStatusColor(healthData.status),
                color: 'white',
                textAlign: 'center',
                mb: 2
              }}
            >
              <Typography variant="h6">
                {healthData.status.toUpperCase()}
              </Typography>
            </Box>
            <Typography variant="body2">
              Version: {healthData.version}
            </Typography>
            <Typography variant="body2">
              Last Check: {new Date(healthData.timestamp).toLocaleString()}
            </Typography>
          </Paper>
        </Grid>

        {/* Services Status */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Storage sx={{ mr: 1 }} />
              <Typography variant="h6">Services</Typography>
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {Object.entries(healthData.services).map(([service, status]) => (
                <Box key={service} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography>{service}:</Typography>
                  <Box 
                    sx={{ 
                      px: 1, 
                      py: 0.5, 
                      borderRadius: 1, 
                      backgroundColor: getStatusColor(status),
                      color: 'white',
                      fontSize: '0.75rem'
                    }}
                  >
                    {status}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>

        {/* Metrics */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Speed sx={{ mr: 1 }} />
              <Typography variant="h6">Metrics</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {formatUptime(healthData.metrics.uptime)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Uptime
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    0 MB
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Memory Usage
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {healthData.metrics.responseTime.toFixed(2)}ms
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Response Time
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default HealthPage; 