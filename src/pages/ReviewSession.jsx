import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  List,
  ListItem,
  ListItemText,
  Rating,
  LinearProgress,
  Button
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';

const ReviewSession = () => {
  const { sessionId } = useParams();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Mock data - in a real app, this would come from an API or database
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockSession = {
        id: sessionId || 'session-1',
        title: 'System Design: URL Shortener',
        date: '2023-08-15',
        duration: '45 minutes',
        transcript: [
          { speaker: 'Interviewer', text: 'Can you design a URL shortening service like TinyURL?' },
          { speaker: 'You', text: 'I would start by clarifying the requirements. For a URL shortener, we need to consider the scale of the system, expected traffic, and whether we need analytics. The core functionality would include URL shortening, redirection, and possibly user accounts and analytics.' },
          { speaker: 'Interviewer', text: 'Great start. How would you design the database schema and what encoding strategy would you use for generating short URLs?' },
          { speaker: 'You', text: 'For the database schema, I would have a table with columns for the original URL, the shortened key, creation timestamp, expiration timestamp, and user ID if we support user accounts. For encoding, I would use base62 encoding which uses a-z, A-Z, and 0-9 characters to create short, readable URLs. This gives us 62^n possible combinations where n is the length of the short key.' },
        ],
        scores: {
          overall: 85,
          requirements: 90,
          systemDesign: 85,
          scalability: 80,
          dataModeling: 85,
          communication: 90
        },
        feedback: [
          'Strong requirements gathering at the beginning',
          'Good explanation of encoding strategy',
          'Could improve on discussing scalability challenges',
          'Well-structured approach to the problem'
        ],
        architectureNotes: [
          'Load Balancer → Application Servers → Database',
          'Redis cache for frequently accessed URLs',
          'Database partitioning strategy for scalability',
          'Analytics service for tracking URL usage'
        ],
        improvementAreas: [
          'Discuss more about database scaling strategies',
          'Consider rate limiting to prevent abuse',
          'Elaborate on monitoring and analytics',
          'Address security concerns like malicious URLs'
        ]
      };
      
      setSession(mockSession);
      setLoading(false);
    }, 1000);
  }, [sessionId]);
  
  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Loading session data...</Typography>
        <LinearProgress />
      </Box>
    );
  }
  
  if (!session) {
    return (
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>Session not found</Typography>
        <Typography>The requested interview session could not be found.</Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ py: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {session.title}
        </Typography>
        
        <Box>
          <Button 
            variant="outlined" 
            startIcon={<DownloadIcon />} 
            sx={{ mr: 2 }}
          >
            Export
          </Button>
          <Button 
            variant="outlined" 
            startIcon={<ShareIcon />}
          >
            Share
          </Button>
        </Box>
      </Box>
      
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Date: {session.date} | Duration: {session.duration}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Transcript and scores */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Interview Transcript
            </Typography>
            
            <Box sx={{ mt: 2 }}>
              {session.transcript.map((entry, index) => (
                <Box key={index} sx={{ mb: 2 }}>
                  <Typography 
                    variant="subtitle2" 
                    color={entry.speaker === 'Interviewer' ? 'primary' : 'secondary'}
                  >
                    {entry.speaker}:
                  </Typography>
                  <Typography variant="body1" sx={{ pl: 2 }}>
                    {entry.text}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Paper>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Performance Scores</Typography>
              </Box>
              
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="body2">Overall Score</Typography>
                  <Typography variant="body1" fontWeight="bold">{session.scores.overall}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={session.scores.overall} 
                  sx={{ height: 10, borderRadius: 5, mt: 1, mb: 2 }} 
                />
              </Box>
              
              <Grid container spacing={2}>
                {Object.entries(session.scores)
                  .filter(([key]) => key !== 'overall')
                  .map(([category, score]) => (
                    <Grid item xs={12} sm={6} key={category}>
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="body2">
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Typography>
                          <Typography variant="body2">{score}%</Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={score} 
                          sx={{ height: 6, borderRadius: 3, mt: 0.5 }} 
                        />
                      </Box>
                    </Grid>
                  ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        
        {/* Right column - Feedback and improvement areas */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TipsAndUpdatesIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Feedback</Typography>
              </Box>
              
              <List>
                {session.feedback.map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText primary={item} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ArchitectureIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Architecture Notes</Typography>
              </Box>
              
              {session.architectureNotes.map((note, index) => (
                <Typography 
                  key={index} 
                  variant="body2" 
                  sx={{ 
                    mb: 1, 
                    p: 1, 
                    bgcolor: 'background.paper', 
                    borderRadius: 1,
                    border: '1px solid',
                    borderColor: 'info.dark'
                  }}
                >
                  {note}
                </Typography>
              ))}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AssessmentIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Areas for Improvement</Typography>
              </Box>
              
              <List>
                {session.improvementAreas.map((area, index) => (
                  <ListItem key={index} sx={{ py: 0.5 }}>
                    <ListItemText primary={area} />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default ReviewSession;