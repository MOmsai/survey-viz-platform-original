import React, { useState } from 'react';
import { Button } from '@mui/material';
import * as XLSX from 'xlsx';
import axios from 'axios';

const FileUpload = ({ onDataLoaded }) => {
  const [file, setFile] = useState(null);

  const handleUpload = async (e) => {
    const selectedFile = e.target.files[0];
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      onDataLoaded(data);
      // Optionally send to backend
      const formData = new FormData();
      formData.append('file', selectedFile);
      await axios.post('http://localhost:5000/api/upload', formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });
    };
    reader.readAsBinaryString(selectedFile);
  };

  return (
    <div>
      <input type="file" accept=".xlsx, .xls" onChange={handleUpload} />
    </div>
  );
};

export default FileUpload;