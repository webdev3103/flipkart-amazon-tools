import React from 'react';
import { Box, Container, Typography, Paper, useTheme, List, ListItem, ListItemText } from '@mui/material';

export const PrivacyPolicyPage: React.FC = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: theme.palette.background.default,
        py: 4,
        px: 2
      }}
    >
      <Container maxWidth="md">
        <Paper 
          elevation={3}
          sx={{
            p: { xs: 3, md: 5 },
            borderRadius: 2,
            bgcolor: theme.palette.background.paper
          }}
        >
          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            Privacy Policy
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom color="text.secondary">
            Last updated: {new Date().toLocaleDateString()}
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Typography variant="body1" paragraph>
              This Privacy Policy describes how Sacred Sutra Tools (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, uses, and discloses your information when you use our mobile application (the &quot;Service&quot;).
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, fontWeight: 'medium' }}>
              Information Collection and Use
            </Typography>
            <Typography variant="body1" paragraph>
              The Service is designed to assist with inventory and order management. To provide these functionalities, we may collect and process certain data.
            </Typography>
            
            <Typography variant="h6" component="h3" gutterBottom>
              Types of Data Collected
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText 
                  primary="Personal Data" 
                  secondary="We may ask you to provide certain personally identifiable information that can be used to contact or identify you, such as your email address (for authentication via Firebase)."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Usage Data" 
                  secondary="We may collect information on how the Service is accessed and used. This Usage Data may include information such as your device&apos;s Internet Protocol address (e.g. IP address), browser type, browser version, and other diagnostic data."
                />
              </ListItem>
              <ListItem>
                <ListItemText 
                  primary="Camera and Photos" 
                  secondary="Our app uses camera permissions to scan barcodes for inventory management. We do not store or transmit images or video from your camera for any other purpose."
                />
              </ListItem>
            </List>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, fontWeight: 'medium' }}>
              Service Providers
            </Typography>
            <Typography variant="body1" paragraph>
              We may employ third-party companies and individuals to facilitate our Service (&quot;Service Providers&quot;), to provide the Service on our behalf, to perform Service-related services or to assist us in analyzing how our Service is used.
            </Typography>
            <Typography variant="body1" paragraph>
              These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
              <br />
              <strong>Google Firebase:</strong> We use Google Firebase for authentication, database, and hosting services.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, fontWeight: 'medium' }}>
              Children&apos;s Privacy
            </Typography>
            <Typography variant="body1" paragraph>
              Our Service does not address anyone under the age of 13. We do not knowingly collect personally identifiable information from anyone under the age of 13. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove that information from our servers.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, fontWeight: 'medium' }}>
              Changes to This Privacy Policy
            </Typography>
            <Typography variant="body1" paragraph>
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes.
            </Typography>

            <Typography variant="h5" component="h2" gutterBottom sx={{ mt: 3, fontWeight: 'medium' }}>
              Contact Us
            </Typography>
            <Typography variant="body1">
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              <a href="mailto:support@sacredsutra.in" style={{ color: theme.palette.primary.main }}>support@sacredsutra.in</a>
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};
