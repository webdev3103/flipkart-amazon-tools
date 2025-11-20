import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  FormControlLabel,
  Checkbox,
  Alert,
  CircularProgress,
  Card,
  Divider,
  InputAdornment,
  IconButton,
  useTheme,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  LockOutlined as LockIcon,
  EmailOutlined as EmailIcon,
  VisibilityOutlined as VisibilityIcon,
  VisibilityOffOutlined as VisibilityOffIcon,
} from '@mui/icons-material';
import { useAppDispatch, useAppSelector } from '../../../store/hooks';
import { login, resetPassword } from '../../../store/slices/authSlice';
import { getSafeAreaInsets } from '../../../utils/mobile';

export const MobileLoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [isResetMode, setIsResetMode] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const theme = useTheme();
  const { loading, error } = useAppSelector((state) => state.auth);

  const safeArea = getSafeAreaInsets();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (isResetMode) {
        await dispatch(resetPassword(email)).unwrap();
        setIsResetMode(false);
      } else {
        await dispatch(login({ email, password, rememberMe })).unwrap();
        navigate('/');
      }
    } catch {
      // Error is handled by Redux
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'background.default'
            : 'primary.light',
        backgroundImage:
          'linear-gradient(rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05))',
        px: 2,
        py: 4,
        // Add safe area padding for iOS
        paddingTop: `max(16px, ${safeArea.top})`,
        paddingBottom: `max(16px, ${safeArea.bottom})`,
      }}
    >
      <Card
        elevation={3}
        sx={{
          p: 3,
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          borderRadius: 3,
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 8px 24px rgba(0,0,0,0.4)'
              : '0 8px 24px rgba(21,101,192,0.15)',
        }}
      >
        {/* Logo/Header */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: 'primary.main',
              color: 'white',
              width: 64,
              height: 64,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 2,
              boxShadow: '0 4px 12px rgba(21,101,192,0.3)',
            }}
          >
            <LockIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography
            variant="h5"
            component="h1"
            align="center"
            sx={{ fontWeight: 'bold', color: 'primary.dark' }}
          >
            {isResetMode ? 'Reset Password' : 'Sign In'}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            align="center"
            sx={{ mt: 1 }}
          >
            {isResetMode
              ? 'Enter your email to receive a password reset link'
              : 'Sign in to access your account'}
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            required
            autoFocus
            autoComplete="email"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <EmailIcon color="primary" />
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 2,
              '& .MuiInputBase-root': {
                minHeight: 56, // Touch-friendly height
              },
            }}
          />

          {!isResetMode && (
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="primary" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ minWidth: 48, minHeight: 48 }} // Touch-friendly
                    >
                      {showPassword ? (
                        <VisibilityOffIcon />
                      ) : (
                        <VisibilityIcon />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                mb: 1,
                '& .MuiInputBase-root': {
                  minHeight: 56, // Touch-friendly height
                },
              }}
            />
          )}

          {!isResetMode && (
            <FormControlLabel
              control={
                <Checkbox
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                  sx={{
                    minWidth: 44,
                    minHeight: 44, // Touch-friendly
                  }}
                />
              }
              label="Remember me"
              sx={{ mb: 1 }}
            />
          )}

          {error && (
            <Alert
              severity={error.includes('sent') ? 'success' : 'error'}
              sx={{ mt: 2, borderRadius: 2 }}
            >
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{
              mt: 3,
              mb: 2,
              py: 1.5,
              minHeight: 56, // Touch-friendly height
              fontWeight: 'bold',
              fontSize: '1rem',
              textTransform: 'none',
              borderRadius: 2,
              boxShadow:
                theme.palette.mode === 'dark'
                  ? '0 4px 12px rgba(0,0,0,0.3)'
                  : '0 4px 12px rgba(21,101,192,0.25)',
            }}
            disabled={loading}
          >
            {loading ? (
              <CircularProgress size={24} color="inherit" />
            ) : isResetMode ? (
              'Send Reset Link'
            ) : (
              'Sign In'
            )}
          </Button>
        </form>

        <Divider sx={{ my: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isResetMode ? 'Remember your password?' : 'Having trouble?'}
          </Typography>
        </Divider>

        {/* Toggle Reset Mode */}
        <Box sx={{ display: 'flex', justifyContent: 'center' }}>
          <Button
            variant="text"
            color="primary"
            onClick={() => setIsResetMode(!isResetMode)}
            sx={{
              fontWeight: 'medium',
              textTransform: 'none',
              minHeight: 48, // Touch-friendly
            }}
          >
            {isResetMode ? 'Back to Sign In' : 'Forgot Password?'}
          </Button>
        </Box>
      </Card>
    </Box>
  );
};
