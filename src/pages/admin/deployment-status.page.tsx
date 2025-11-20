import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Alert,
  LinearProgress
} from '@mui/material';
import {
  CheckCircle,
  Error,
  Warning,
  Refresh,
  Timeline,
  Speed,
  Security
} from '@mui/icons-material';
import { useIsMobile } from '../../utils/mobile';
import { MobileAppShell } from '../../navigation/MobileAppShell';

interface DeploymentStatus {
  id: string;
  version: string;
  deploymentTime: string;
  status: 'success' | 'failed' | 'pending';
  validationResults: {
    healthCheck: 'passed' | 'failed' | 'pending';
    performanceCheck: 'passed' | 'failed' | 'warning' | 'pending';
    securityCheck: 'passed' | 'failed' | 'pending';
  };
  metrics: {
    responseTime: number;
    uptime: number;
    errorRate: number;
  };
}

const DeploymentStatusPage: React.FC = () => {
  const isMobile = useIsMobile();
  const [loading, setLoading] = React.useState(true);
  const [deployments, setDeployments] = React.useState<DeploymentStatus[]>([]);
  const [currentDeployment, setCurrentDeployment] = React.useState<DeploymentStatus | null>(null);

  React.useEffect(() => {
    // Simulate loading deployment status
    const loadDeploymentStatus = async () => {
      try {
        // In a real implementation, this would fetch from an API
        const mockDeployments: DeploymentStatus[] = [
          {
            id: '1',
            version: '1.2.3',
            deploymentTime: new Date().toISOString(),
            status: 'success',
            validationResults: {
              healthCheck: 'passed',
              performanceCheck: 'passed',
              securityCheck: 'passed'
            },
            metrics: {
              responseTime: 245,
              uptime: 99.9,
              errorRate: 0.1
            }
          },
          {
            id: '2',
            version: '1.2.2',
            deploymentTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            status: 'success',
            validationResults: {
              healthCheck: 'passed',
              performanceCheck: 'warning',
              securityCheck: 'passed'
            },
            metrics: {
              responseTime: 380,
              uptime: 99.8,
              errorRate: 0.2
            }
          }
        ];

        setDeployments(mockDeployments);
        setCurrentDeployment(mockDeployments[0]);
      } catch (error) {
        console.error('Failed to load deployment status:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDeploymentStatus();
  }, []);

  const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
    switch (status) {
      case 'success':
      case 'passed':
        return 'success';
      case 'failed':
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'passed':
        return <CheckCircle color="success" />;
      case 'failed':
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      default:
        return <Refresh color="action" />;
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Deployment Status
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  const content = (
    <Box sx={{ p: isMobile ? 2 : 3 }}>
      <Typography variant="h4" gutterBottom>
        Deployment Status Dashboard
      </Typography>

      {/* Current Deployment Status */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Alert 
            severity={currentDeployment?.status === 'success' ? 'success' : 'error'}
            icon={getStatusIcon(currentDeployment?.status || 'pending')}
          >
            <Typography variant="h6">
              Current Deployment: v{currentDeployment?.version}
            </Typography>
            <Typography>
              Deployed: {currentDeployment ? new Date(currentDeployment.deploymentTime).toLocaleString() : 'Unknown'}
            </Typography>
          </Alert>
        </Grid>
      </Grid>

      {/* Key Metrics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Speed sx={{ mr: 1 }} color="primary" />
                <Typography variant="h6">Response Time</Typography>
              </Box>
              <Typography variant="h3" color="primary">
                {currentDeployment?.metrics.responseTime || 0}ms
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Average response time
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Timeline sx={{ mr: 1 }} color="success" />
                <Typography variant="h6">Uptime</Typography>
              </Box>
              <Typography variant="h3" color="success.main">
                {currentDeployment?.metrics.uptime || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                System availability
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Security sx={{ mr: 1 }} color="warning" />
                <Typography variant="h6">Error Rate</Typography>
              </Box>
              <Typography variant="h3" color="warning.main">
                {currentDeployment?.metrics.errorRate || 0}%
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Error percentage
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Validation Results */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Validation Results
            </Typography>
            
            {currentDeployment && (
              <List>
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(currentDeployment.validationResults.healthCheck)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Health Check"
                    secondary="Application health endpoint validation"
                  />
                  <Chip 
                    label={currentDeployment.validationResults.healthCheck.toUpperCase()}
                    color={getStatusColor(currentDeployment.validationResults.healthCheck)}
                    size="small"
                  />
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(currentDeployment.validationResults.performanceCheck)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Performance Check"
                    secondary="Load time and responsiveness validation"
                  />
                  <Chip 
                    label={currentDeployment.validationResults.performanceCheck.toUpperCase()}
                    color={getStatusColor(currentDeployment.validationResults.performanceCheck)}
                    size="small"
                  />
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemIcon>
                    {getStatusIcon(currentDeployment.validationResults.securityCheck)}
                  </ListItemIcon>
                  <ListItemText 
                    primary="Security Check"
                    secondary="Security headers and vulnerability scan"
                  />
                  <Chip 
                    label={currentDeployment.validationResults.securityCheck.toUpperCase()}
                    color={getStatusColor(currentDeployment.validationResults.securityCheck)}
                    size="small"
                  />
                </ListItem>
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Deployments */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Deployments
            </Typography>
            
            <List>
              {deployments.slice(0, 5).map((deployment, index) => (
                <React.Fragment key={deployment.id}>
                  <ListItem>
                    <ListItemIcon>
                      {getStatusIcon(deployment.status)}
                    </ListItemIcon>
                    <ListItemText 
                      primary={`Version ${deployment.version}`}
                      secondary={new Date(deployment.deploymentTime).toLocaleString()}
                    />
                    <Chip 
                      label={deployment.status.toUpperCase()}
                      color={getStatusColor(deployment.status)}
                      size="small"
                    />
                  </ListItem>
                  {index < deployments.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  if (isMobile) {
    return (
      <MobileAppShell pageTitle="Deployment Status">
        {content}
      </MobileAppShell>
    );
  }

  return content;
};

export default DeploymentStatusPage; 