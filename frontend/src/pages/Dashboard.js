import React, { useContext, useState, useEffect, useCallback } from 'react';
import { Typography, Button, Container, FormControl, InputLabel, Select, MenuItem, Table, TableBody, TableCell, TableHead, TableRow, Paper, Checkbox, TextField } from '@mui/material';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import FileUpload from '../components/Upload/FileUpload';
import * as math from 'mathjs';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, RadarChart, Radar,
  AreaChart, Area, ScatterChart, Scatter, RadialBarChart, RadialBar,
  ComposedChart, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Cell,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [uploadedData, setUploadedData] = useState(null);
  const [chartType, setChartType] = useState('Bar');
  const [xAxis, setXAxis] = useState('');
  const [yAxis, setYAxis] = useState([]);
  const [filters, setFilters] = useState({});
  const [metrics, setMetrics] = useState({});
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const handleDataLoaded = (data) => {
    if (!data || !data[0] || data.length < 2) {
      alert('Invalid or empty data uploaded');
      return;
    }
    setUploadedData(data);
    setXAxis(data[0][0] || '');
    setYAxis([data[0][1] || '']);
    setFilters(data[0].reduce((acc, col) => ({ ...acc, [col]: { type: 'text', value: '' } }), {}));
    setMetrics({});
    setAiResponse('');
  };

  const handleFilterChange = (column, value) => {
    setFilters(prev => ({ ...prev, [column]: { ...prev[column], value } }));
  };

  const getFilteredData = useCallback(() => {
    if (!uploadedData || !xAxis || yAxis.length === 0) return [];
    let chartData = uploadedData.slice(1).map(row => {
      const xValue = row[uploadedData[0].indexOf(xAxis)] || 'Unknown';
      const yValues = yAxis.map(col => {
        const value = Number(row[uploadedData[0].indexOf(col)]);
        return isNaN(value) ? 0 : value;
      });
      return {
        [xAxis]: xValue,
        ...Object.fromEntries(yAxis.map((col, i) => [col, yValues[i]])),
        ...Object.fromEntries(uploadedData[0].map((col, i) => [col, row[i] || ''])),
      };
    });

    for (const [column, { value }] of Object.entries(filters)) {
      if (value) {
        chartData = chartData.filter(row => row[column].toString().toLowerCase().includes(value.toLowerCase()));
      }
    }

    return chartData.filter(row => row[xAxis] !== undefined && yAxis.every(col => !isNaN(row[col])));
  }, [uploadedData, xAxis, yAxis, filters]);

  const calculateMetrics = (data, fields) => {
    const result = {};
    fields.forEach(field => {
      const values = data.map(row => Number(row[field]) || 0).filter(v => !isNaN(v));
      if (values.length > 0) {
        result[field] = {
          Sum: values.reduce((a, b) => a + b, 0),
          Average: math.mean(values),
          Max: math.max(...values),
          Min: math.min(...values),
          Median: math.median(values),
          'Standard Deviation': math.std(values),
          'Quartile 1': math.quantileSeq(values, 0.25),
          'Quartile 3': math.quantileSeq(values, 0.75),
        };
      } else {
        result[field] = {
          Sum: 0, Average: 0, Max: 0, Min: 0, Median: 0, 'Standard Deviation': 0, 'Quartile 1': 0, 'Quartile 3': 0,
        };
      }
    });
    return result;
  };

  useEffect(() => {
    if (uploadedData && yAxis.length > 0) {
      const xAxisIndex = uploadedData[0].indexOf(xAxis);
      const yAxisIndices = yAxis.map(col => uploadedData[0].indexOf(col));
      if (xAxisIndex !== -1 && yAxisIndices.every(i => i !== -1)) {
        const filteredData = getFilteredData();
        setMetrics(calculateMetrics(filteredData, yAxis));
      }
    }
  }, [uploadedData, xAxis, yAxis, filters, getFilteredData]);

const handleAIQuery = async () => {
  if (!aiQuery.trim() || !GEMINI_API_KEY) {
    alert('Please enter a query and ensure your Gemini API key is set.');
    return;
  }
  setIsAIAnalyzing(true);
  try {
    const filteredData = getFilteredData();
    if (filteredData.length === 0) {
      alert('No data available for analysis. Please upload data and apply filters.');
      return;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const dataToSend = filteredData; // Use full data for this small dataset

    // Precompute sum of Age for validation
    const ageSum = filteredData.reduce((sum, row) => sum + (Number(row.Age) || 0), 0);

    const prompt = `Analyze this survey data and answer the question: "${aiQuery}". Use only the provided data.

Data details:
- Columns: ${Object.keys(filteredData[0] || {}).join(', ')}
- Data rows (all available): ${JSON.stringify(dataToSend, null, 2)}

Instructions:
- If the query involves calculating a sum (e.g., sum of Age), compute it accurately from the 'Age' column.
- Provide the exact numerical result and avoid approximations unless specified.
- Return the result in this format: "The sum of Age is [value]." for sum queries, or provide relevant insights for other queries.

Validation: The precomputed sum of Age is ${ageSum} for reference.`;

    const result = await model.generateContent(prompt);
    setAiResponse(result.response.text());
  } catch (err) {
    console.error('AI Analysis error:', err);
    alert(`AI analysis failed. Details: ${err.message}. Try reducing dataset size or checking limits.`);
  } finally {
    setIsAIAnalyzing(false);
  }
};
  const renderChart = () => {
    if (!uploadedData || uploadedData.length < 2 || !xAxis || yAxis.length === 0) {
      return <Typography>No valid data or axes selected</Typography>;
    }

    const xAxisIndex = uploadedData[0].indexOf(xAxis);
    const yAxisIndices = yAxis.map(col => uploadedData[0].indexOf(col));
    if (xAxisIndex === -1 || yAxisIndices.some(index => index === -1)) {
      return <Typography>Selected axes not found in data</Typography>;
    }

    const chartData = getFilteredData();

    if (chartData.length === 0) {
      return <Typography>No valid data points for charting</Typography>;
    }

    switch (chartType) {
      case 'Bar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey={xAxis} stroke="#333" />
              <YAxis stroke="#333" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
              {yAxis.map((y, index) => (
                <Bar key={y} dataKey={y} fill={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'Line':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey={xAxis} stroke="#333" />
              <YAxis stroke="#333" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
              {yAxis.map((y, index) => (
                <Line key={y} type="monotone" dataKey={y} stroke={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
      case 'Pie':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={chartData} dataKey={yAxis[0]} nameKey={xAxis} fill="#4CAF50" label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'Donut':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <PieChart>
              <Pie data={chartData} dataKey={yAxis[0]} nameKey={xAxis} innerRadius={60} outerRadius={80} fill="#4CAF50" label>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
            </PieChart>
          </ResponsiveContainer>
        );
      case 'Radar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={chartData}>
              <PolarGrid stroke="#E0E0E0" />
              <PolarAngleAxis dataKey={xAxis} stroke="#333" />
              <PolarRadiusAxis stroke="#333" />
              <Radar dataKey={yAxis[0]} stroke="#4CAF50" fill="#4CAF50" fillOpacity={0.6} />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
            </RadarChart>
          </ResponsiveContainer>
        );
      case 'Area':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey={xAxis} stroke="#333" />
              <YAxis stroke="#333" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
              {yAxis.map((y, index) => (
                <Area key={y} type="monotone" dataKey={y} stackId="1" stroke={['#4CAF50', '#2196F3'][index % 2]} fill={['#4CAF50', '#2196F3'][index % 2]} />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'Scatter':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid stroke="#E0E0E0" />
              <XAxis dataKey={xAxis} stroke="#333" />
              <YAxis stroke="#333" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
              {yAxis.map((y, index) => (
                <Scatter key={y} data={chartData} dataKey={y} fill={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
              ))}
            </ScatterChart>
          </ResponsiveContainer>
        );
      case 'RadialBar':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <RadialBarChart data={chartData} innerRadius="10%" outerRadius="80%">
              <RadialBar dataKey={yAxis[0]} background>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
                ))}
              </RadialBar>
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
            </RadialBarChart>
          </ResponsiveContainer>
        );
      case 'Composed':
        return (
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
              <XAxis dataKey={xAxis} stroke="#333" />
              <YAxis stroke="#333" />
              <Tooltip contentStyle={{ backgroundColor: '#FFF', color: '#333', border: '1px solid #DDD' }} />
              <Legend wrapperStyle={{ color: '#333' }} />
              {yAxis.map((y, index) => (
                <Bar key={y} dataKey={y} fill={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
              ))}
              {yAxis.map((y, index) => (
                <Line key={`${y}-line`} type="monotone" dataKey={y} stroke={['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'][index % 5]} />
              ))}
            </ComposedChart>
          </ResponsiveContainer>
        );
      default:
        return <Typography>No valid data or axes selected</Typography>;
    }
  };

  return (
    <Container
      maxWidth={false}
      style={{
        backgroundColor: '#FFFFFF',
        minHeight: '100vh',
        color: '#333',
        padding: '2rem',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        style={{
          fontWeight: '700',
          color: '#2C3E50',
          borderBottom: '2px solid #4CAF50',
          paddingBottom: '0.5rem',
        }}
      >
        Survey Dashboard
      </Typography>
      {user && (
        <Typography
          variant="h6"
          style={{
            fontWeight: '500',
            marginBottom: '1rem',
            color: '#666',
          }}
        >
          Welcome, {user.email}
        </Typography>
      )}
      <Button
        variant="contained"
        color="primary"
        onClick={() => {
          logout();
          navigate('/login');
        }}
        style={{
          marginTop: '1rem',
          backgroundColor: '#FF5722',
          color: '#FFF',
          padding: '0.5rem 1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          textTransform: 'none',
          fontWeight: '500',
        }}
        onMouseOver={(e) => (e.target.style.backgroundColor = '#E64A19')}
        onMouseOut={(e) => (e.target.style.backgroundColor = '#FF5722')}
      >
        Logout
      </Button>
      <FileUpload onDataLoaded={handleDataLoaded} />
      {uploadedData && (
        <div>
          <FormControl
            fullWidth
            variant="outlined"
            style={{
              marginTop: '2rem',
              backgroundColor: '#F5F5F5',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            <InputLabel
              style={{
                color: '#666',
                fontWeight: '500',
              }}
            >
              Chart Type
            </InputLabel>
            <Select
              value={chartType}
              onChange={(e) => setChartType(e.target.value)}
              style={{
                color: '#333',
                backgroundColor: 'transparent',
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    backgroundColor: '#FFF',
                    color: '#333',
                  },
                },
              }}
            >
              <MenuItem value="Bar" style={{ color: '#333' }}>Bar Chart</MenuItem>
              <MenuItem value="Line" style={{ color: '#333' }}>Line Chart</MenuItem>
              <MenuItem value="Pie" style={{ color: '#333' }}>Pie Chart</MenuItem>
              <MenuItem value="Donut" style={{ color: '#333' }}>Donut Chart</MenuItem>
              <MenuItem value="Radar" style={{ color: '#333' }}>Radar Chart</MenuItem>
              <MenuItem value="Area" style={{ color: '#333' }}>Area Chart</MenuItem>
              <MenuItem value="Scatter" style={{ color: '#333' }}>Scatter Plot</MenuItem>
              <MenuItem value="RadialBar" style={{ color: '#333' }}>Radial Bar Chart</MenuItem>
              <MenuItem value="Composed" style={{ color: '#333' }}>Composed Chart</MenuItem>
            </Select>
          </FormControl>
          <FormControl
            fullWidth
            variant="outlined"
            style={{
              marginTop: '1rem',
              backgroundColor: '#F5F5F5',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            <InputLabel
              style={{
                color: '#666',
                fontWeight: '500',
              }}
            >
              X-Axis
            </InputLabel>
            <Select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              style={{
                color: '#333',
                backgroundColor: 'transparent',
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    backgroundColor: '#FFF',
                    color: '#333',
                  },
                },
              }}
            >
              {uploadedData[0]?.map((col, index) => (
                <MenuItem key={index} value={col} style={{ color: '#333' }}>
                  {col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl
            fullWidth
            variant="outlined"
            style={{
              marginTop: '1rem',
              backgroundColor: '#F5F5F5',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
            }}
          >
            <InputLabel
              style={{
                color: '#666',
                fontWeight: '500',
              }}
            >
              Y-Axis
            </InputLabel>
            <Select
              multiple
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              renderValue={(selected) => selected.join(', ')}
              style={{
                color: '#333',
                backgroundColor: 'transparent',
              }}
              MenuProps={{
                PaperProps: {
                  style: {
                    backgroundColor: '#FFF',
                    color: '#333',
                  },
                },
              }}
            >
              {uploadedData[0]?.map((col, index) => (
                <MenuItem key={index} value={col} style={{ color: '#333' }}>
                  <Checkbox
                    checked={yAxis.includes(col)}
                    style={{ color: yAxis.includes(col) ? '#4CAF50' : '#999' }}
                  />
                  {col}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Typography
            variant="h6"
            style={{
              marginTop: '2rem',
              fontWeight: '600',
              color: '#2C3E50',
            }}
          >
            Filters
          </Typography>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '1rem',
              marginTop: '1rem',
            }}
          >
            {Object.keys(filters).map((col, index) => (
              <TextField
                key={index}
                label={`Filter by ${col}`}
                value={filters[col].value}
                onChange={(e) => handleFilterChange(col, e.target.value)}
                variant="outlined"
                fullWidth
                style={{
                  backgroundColor: '#F5F5F5',
                  borderRadius: '8px',
                }}
                InputLabelProps={{ style: { color: '#666' } }}
                InputProps={{ style: { color: '#333' } }}
              />
            ))}
          </div>
          <div style={{ marginTop: '2rem' }}>{renderChart()}</div>
          <Typography
            variant="h6"
            style={{
              marginTop: '2rem',
              fontWeight: '600',
              color: '#2C3E50',
            }}
          >
            Metrics
          </Typography>
          <Paper
            elevation={3}
            style={{
              marginTop: '1rem',
              backgroundColor: '#FFF',
              borderRadius: '8px',
              padding: '1rem',
              overflowX: 'auto',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell style={{ color: '#4CAF50', fontWeight: 'bold' }}>Metric</TableCell>
                  {yAxis.map((col, index) => (
                    <TableCell key={index} style={{ color: '#4CAF50', fontWeight: 'bold' }}>
                      {col}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {Object.keys(metrics[yAxis[0]] || {}).map((metric, index) => (
                  <TableRow key={index}>
                    <TableCell style={{ color: '#333' }}>{metric}</TableCell>
                    {yAxis.map((col, idx) => (
                      <TableCell key={idx} style={{ color: '#333' }}>
                        {metrics[col]?.[metric]?.toFixed(2) || 'N/A'}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
          <Typography
            variant="h6"
            style={{
              marginTop: '2rem',
              fontWeight: '600',
              color: '#2C3E50',
            }}
          >
            AI Insights
          </Typography>
          <Paper
            elevation={3}
            style={{
              marginTop: '1rem',
              backgroundColor: '#FFF',
              borderRadius: '8px',
              padding: '1rem',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            <TextField
              label="Ask about your data (e.g., 'What is the average NPS score?')"
              value={aiQuery}
              onChange={(e) => setAiQuery(e.target.value)}
              variant="outlined"
              fullWidth
              style={{ marginBottom: '1rem', backgroundColor: '#F5F5F5', borderRadius: '8px' }}
              InputLabelProps={{ style: { color: '#666' } }}
              InputProps={{ style: { color: '#333' } }}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleAIQuery}
              disabled={isAIAnalyzing}
              style={{
                backgroundColor: '#2196F3',
                color: '#FFF',
                padding: '0.5rem 1.5rem',
                borderRadius: '8px',
                textTransform: 'none',
                fontWeight: '500',
              }}
              onMouseOver={(e) => (e.target.style.backgroundColor = '#1976D2')}
              onMouseOut={(e) => (e.target.style.backgroundColor = '#2196F3')}
            >
              {isAIAnalyzing ? 'Analyzing...' : 'Get Insights'}
            </Button>
            {aiResponse && (
              <Paper
                elevation={1}
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  backgroundColor: '#F5F5F5',
                  borderRadius: '8px',
                  color: '#333',
                }}
              >
                <Typography>{aiResponse}</Typography>
              </Paper>
            )}
          </Paper>
        </div>
      )}
    </Container>
  );
};

export default Dashboard;
