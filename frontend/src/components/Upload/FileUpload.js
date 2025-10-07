import React, { useState } from 'react';
import { Button, Container, Typography } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const FileUpload = ({ onDataLoaded }) => {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    const formData = new FormData();
    formData.append('file', selectedFile);
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to upload files');
      navigate('/login');
      return;
    }
    try {
      const res = await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
      });
      onDataLoaded(res.data.data);
      alert('File uploaded successfully');
    } catch (err) {
      console.error('Upload error:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert('File upload failed');
      }
    }
  };

  return (
    <Container>
      <Typography variant="h6" gutterBottom>Upload Excel File</Typography>
      <input type="file" accept=".xlsx, .xls" onChange={handleUpload} />
    </Container>
  );
};

export default FileUpload;