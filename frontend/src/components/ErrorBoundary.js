import React from 'react';
import { Typography } from '@mui/material';

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div>
          <Typography variant="h4">Chart Rendering Error</Typography>
          <Typography>{this.state.error?.message}</Typography>
        </div>
        
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;