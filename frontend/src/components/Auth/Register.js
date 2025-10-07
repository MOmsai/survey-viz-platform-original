import React, { useState, useContext } from 'react';
import { TextField, Button, Typography, Paper, Box, Avatar } from '@mui/material';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import HowToRegIcon from '@mui/icons-material/HowToReg';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/auth/register', { email, password });
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      console.error('Registration error:', err);
      alert('Registration failed. Email may already be in use.');
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
            bgcolor: '#2196F3',
            width: 70,
            height: 70,
            margin: '0 auto 1.5rem',
          }}
        >
          <HowToRegIcon sx={{ fontSize: 40, color: '#FFF' }} />
        </Avatar>
        <Typography variant="h4" gutterBottom fontWeight="bold" color="#2C3E50">
          Sign Up
        </Typography>
        <Typography variant="subtitle1" gutterBottom color="#666">
          Create your survey account
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
            sx={{ mt: 2, py: 1.5, borderRadius: '8px', backgroundColor: '#2196F3', '&:hover': { backgroundColor: '#1976D2' } }}
          >
            Register
          </Button>
        </form>
        <Typography variant="body2" sx={{ mt: 2, color: '#666' }}>
          Already have an account? <Link to="/login" style={{ color: '#2196F3', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>Login</Link>
        </Typography>
      </Paper>
    </Box>
  );
};

export default Register;