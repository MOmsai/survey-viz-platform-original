import React, { useState, useContext } from 'react';
import { TextField, Button, Typography, Paper, Box, Avatar } from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      alert('Login failed. Check your credentials.');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        padding: '2rem',
      }}
    >
      <Paper
        elevation={6}
        sx={{
          p: 4,
          borderRadius: '12px',
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
          backgroundColor: '#FFF',
          boxShadow: '0 8px 16px rgba(0, 0, 0, 0.1)',
        }}
      >
        <Avatar
          sx={{
            bgcolor: '#4CAF50',
            width: 70,
            height: 70,
            margin: '0 auto 1.5rem',
          }}
        >
          <AssignmentTurnedInIcon sx={{ fontSize: 40, color: '#FFF' }} />
        </Avatar>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="#2C3E50">
          Login
        </Typography>
        <Typography variant="subtitle1" gutterBottom color="#666">
          Welcome back! Please sign in
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputProps={{ style: { borderRadius: '8px' } }}
            InputLabelProps={{ style: { color: '#666' } }}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
            variant="outlined"
            InputProps={{ style: { borderRadius: '8px' } }}
            InputLabelProps={{ style: { color: '#666' } }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2, py: 1.5, borderRadius: '8px', backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45A049' } }}
          >
            Login
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
          Don’t have an account? <Link to="/register" style={{ color: '#4CAF50', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Sign up</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Login;