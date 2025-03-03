import React, { useState } from 'react';
import { 
  Typography, 
  Box, 
  Card, 
  CardContent, 
  Grid, 
  Button, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon,
  Paper,
  Divider
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import MicIcon from '@mui/icons-material/Mic';
import HistoryIcon from '@mui/icons-material/History';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import SchoolIcon from '@mui/icons-material/School';

const Dashboard = () => {
  const navigate = useNavigate();
  const [recentSessions] = useState([
    { id: 'session-1', title: 'System Design: Twitter', date: '2023-08-15', score: 85 },
    { id: 'session-2', title: 'System Design: Netflix', date: '2023-08-10', score: 78 },
  ]);

  const commonTopics = [
    'URL Shortener',
    'Social Media Platform',
    'E-commerce System',
    'Video Streaming Service',
    'Chat Application',
    'Distributed File System'
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Welcome to AI System Design Interview Assistant
      </Typography>
      
      <Typography variant="body1" paragraph>
        Get real-time assistance during your system design interviews with AI-powered suggestions,
        architecture visualization, and performance analysis.
      </Typography>
      
      <Grid container spacing={4} sx={{ mt: 2 }}>
        {/* Left column */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <MicIcon color="primary" sx={{ mr: 2, fontSize: 40 }} />
                <Typography variant="h5" component="h2">
                  Start a New Interview Session
                </Typography>
              </Box>
              
              <Typography variant="body1" sx={{ mb: 3 }}>
                Begin a new system design interview with real-time AI assistance.
                Our assistant will listen to your conversation and provide helpful suggestions.
              </Typography>
              
              <Button 
                variant="contained" 
                size="large" 
                startIcon={<MicIcon />}
                onClick={() => navigate('/interview')}
              >
                Start New Interview
              </Button>
            </CardContent>
          </Card>
          
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Common System Design Topics
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {commonTopics.map((topic, index) => (
                <Grid item xs={12} sm={6} key={index}>
                  <Card variant="outlined" sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
                    <SchoolIcon sx={{ mr: 2 }} color="primary" />
                    <Typography variant="body1">{topic}</Typography>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        
        {/* Right column */}
        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 4 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <HistoryIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Recent Sessions</Typography>
              </Box>
              
              <List>
                {recentSessions.map((session) => (
                  <React.Fragment key={session.id}>
                    <ListItem 
                      button 
                      onClick={() => navigate(`/review/${session.id}`)}
                    >
                      <ListItemText 
                        primary={session.title} 
                        secondary={`Date: ${session.date} | Score: ${session.score}%`} 
                      />
                    </ListItem>
                    <Divider />
                  </React.Fragment>
                ))}
              </List>
              
              <Button 
                variant="outlined" 
                fullWidth 
                sx={{ mt: 2 }}
                onClick={() => navigate('/review/latest')}
              >
                View All Sessions
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TipsAndUpdatesIcon color="primary" sx={{ mr: 2 }} />
                <Typography variant="h6">Quick Tips</Typography>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <TipsAndUpdatesIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Start with requirements clarification" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TipsAndUpdatesIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Estimate scale and constraints early" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TipsAndUpdatesIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Consider both read and write paths" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <TipsAndUpdatesIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary="Discuss trade-offs in your design" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;