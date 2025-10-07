import React from 'react';
import { Typography, Container, Box, Button, Paper } from '@mui/material';
import { Link } from 'react-router-dom';
import { styled } from '@mui/system';

const HeroBox = styled(Box)(({ theme }) => ({
  minHeight: '70vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #E3F2FD 0%, #FFFFFF 100%)',
  padding: '4rem 2rem',
  borderRadius: '16px',
  boxShadow: '0 6px 12px rgba(0, 0, 0, 0.1)',
  marginTop: '2rem',
}));

const Home = () => {
  return (
    <Container maxWidth={false} style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', padding: '2rem', fontFamily: 'Arial, sans-serif' }}>
      <HeroBox>
        <Paper elevation={6} sx={{ p: 4, textAlign: 'center', borderRadius: '12px', maxWidth: 600, width: '100%', backgroundColor: 'rgba(255, 255, 255, 0.9)' }}>
          <Typography
            variant="h2"
            gutterBottom
            style={{
              fontWeight: 700,
              color: '#2C3E50',
              textShadow: '1px 1px 3px rgba(0, 0, 0, 0.1)',
            }}
          >
            Welcome to Survey Viz Platform
          </Typography>
          <Typography
            variant="h6"
            gutterBottom
            style={{
              color: '#666',
              fontWeight: 400,
              marginBottom: '2rem',
              lineHeight: 1.6,
            }}
          >
            Transform your survey data into actionable insights with stunning visualizations. Explore, analyze, and share with ease!
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              color="primary"
              sx={{ px: 3, py: 1.5, borderRadius: '8px', backgroundColor: '#4CAF50', '&:hover': { backgroundColor: '#45A049' } }}
            >
              Login
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="outlined"
              color="primary"
              sx={{ px: 3, py: 1.5, borderRadius: '8px', color: '#2196F3', borderColor: '#2196F3', '&:hover': { backgroundColor: '#E3F2FD', borderColor: '#1976D2' } }}
            >
              Register
            </Button>
          </Box>
        </Paper>
      </HeroBox>
    </Container>
  );
};

export default Home;