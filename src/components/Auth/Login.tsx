import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Container
} from '@mui/material';

interface LoginProps {
  onLogin: (password: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Mot de passe simple - vous pouvez le changer
    const correctPassword = 'kerawen2024';
    
    if (password === correctPassword) {
      localStorage.setItem('isAuthenticated', 'true');
      onLogin(password);
    } else {
      setError('Mot de passe incorrect');
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            maxWidth: 400
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom align="center">
            🔐 STAT-KERAWEN
          </Typography>
          
          <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 3 }}>
            Application d'analyse de ventes
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              required
            />
            
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 3 }}
            >
              Se connecter
            </Button>
          </form>
          
          <Typography variant="caption" color="text.secondary" align="center" sx={{ mt: 2, display: 'block' }}>
            Contactez l'administrateur pour obtenir le mot de passe
          </Typography>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login;
