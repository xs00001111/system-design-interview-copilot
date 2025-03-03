import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Box, Container } from '@mui/material';

// Import pages
import Dashboard from './pages/Dashboard';
import InterviewSession from './pages/InterviewSession';
import ReviewSession from './pages/ReviewSession';
import Settings from './pages/Settings';

// Import components
import Navbar from './components/Navbar';
import ScreenCapture from './components/ScreenCapture';

function App() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Navbar />
      <Container component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/interview" element={<InterviewSession />} />
          <Route path="/review/:sessionId" element={<ReviewSession />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Container>
      <ScreenCapture />
    </Box>
  );
}

export default App;