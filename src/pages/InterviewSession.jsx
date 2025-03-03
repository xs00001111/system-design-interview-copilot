import React, { useState, useEffect, useRef } from 'react';

// For Electron IPC communication via preload script
const api = window.api;
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Chip,
  IconButton,
  TextField,
  CircularProgress
} from '@mui/material';
import MicIcon from '@mui/icons-material/Mic';
import StopIcon from '@mui/icons-material/Stop';
import ArchitectureIcon from '@mui/icons-material/Architecture';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import WarningIcon from '@mui/icons-material/Warning';
import SaveIcon from '@mui/icons-material/Save';

// Import OpenAI service
import OpenAIService from '../utils/openaiService';

const InterviewSession = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [followUpQuestions, setFollowUpQuestions] = useState([]);
  const [architectureNotes, setArchitectureNotes] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionStarted, setSessionStarted] = useState(false);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordingError, setRecordingError] = useState('');
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [displayedTranscript, setDisplayedTranscript] = useState('');
  const [wordQueue, setWordQueue] = useState([]);
  
  const transcriptRef = useRef(null);
  const openaiServiceRef = useRef(null);
  const debouncedProcessRef = useRef(null);

  // Initialize OpenAI service with API key from settings or environment
  useEffect(() => {
    // In Vite, environment variables are accessed through import.meta.env
    // The VITE_ prefix is required for variables to be exposed to the client
    const apiKey = localStorage.getItem('openai_api_key') || import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setRecordingError('OpenAI API key not found. Please add your API key in settings.');
      return;
    }
    try {
      openaiServiceRef.current = new OpenAIService(apiKey);
    } catch (error) {
      setRecordingError(`Failed to initialize OpenAI service: ${error.message}`);
    }
  }, []);
  
  // Scroll to bottom of transcript when it updates
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);

  // For MediaRecorder API
  const [recognition, setRecognition] = useState(null); // Keeping for backward compatibility
  const [interimTranscript, setInterimTranscript] = useState(''); // Keeping for backward compatibility

  useEffect(() => {
    // Set up IPC listeners for voice recording
    if (api) {
      api.onStartRecording(() => {
        if (!isRecording) {
          startRecording();
        }
      });
      
      api.onStopRecording(() => {
        if (isRecording) {
          stopRecording();
        }
      });
      
      // Clean up listeners on unmount
      return () => {
        api.removeAllListeners('start-recording-browser');
        api.removeAllListeners('stop-recording-browser');
      };
    }
  }, [isRecording]);

  const startRecording = async () => {
    // Clear any previous errors
    setRecordingError('');
    
    // Check if browser supports required APIs
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Your browser does not support audio recording. Please try a modern browser like Chrome or Firefox.');
      return;
    }
    
    try {
      // Request microphone access with explicit error handling
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true,
        video: false // Explicitly deny video to make the permission request clearer
      });
      
      setAudioStream(stream);

      // Check if MediaRecorder is supported
      if (!window.MediaRecorder) {
        setRecordingError('Your browser does not support MediaRecorder API. Please try a modern browser.');
        // Clean up the stream since we can't use it
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Create recorder with appropriate MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      setMediaRecorder(recorder);

      // Add debounce utility at the top of the component
      const debounce = (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
          const later = () => {
            clearTimeout(timeout);
            func(...args);
          };
          clearTimeout(timeout);
          timeout = setTimeout(later, wait);
        };
      };
      
      // Inside the InterviewSession component, after state declarations
      debouncedProcessRef.current = debounce((text) => {
        processInterviewQuestion(text);
      }, 2000); // Debounce AI processing to every 2 seconds
      
      // Update the startRecording function's recorder setup
      const chunks = [];
      let interimTranscript = '';
      
      // Set up real-time transcription callback
      if (openaiServiceRef.current) {
        openaiServiceRef.current.clearTranscriptionBuffer();
        openaiServiceRef.current.setTranscriptionCallback((text) => {
          if (text && text.trim() !== interimTranscript.trim()) {
            interimTranscript = text;
            console.log('Received transcript:', text);
            const words = text.split(' ');
            setWordQueue(prev => [...prev, ...words]);
            
            setTranscript(prev => {
              const newTranscript = prev.includes('You: ') ?
                prev.split('You: ').slice(0, -1).join('You: ') + 'You: ' + text :
                prev + '\nYou: ' + text;
              return newTranscript;
            });
            
            // Use the debounced process function from the component level
            if (debouncedProcessRef.current) {
              debouncedProcessRef.current(text);
            }
          }
        });
      }

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
          setAudioChunks([...chunks]);
          
          // Process this chunk in real-time if OpenAI service is available
          if (openaiServiceRef.current && isRecording) {
            try {
              setIsTranscribing(true);
              await openaiServiceRef.current.processAudioChunk(e.data);
            } catch (error) {
              console.error('Real-time transcription error:', error);
              // Don't show errors for every chunk - it would be too noisy
            }
          }
        }
      };

      // Handle recorder errors
      recorder.onerror = (event) => {
        console.error('MediaRecorder error:', event.error);
        setRecordingError(`Recording error: ${event.error.message || 'Unknown error'}`);
        stopRecording();
      };

      recorder.onstop = async () => {
        if (chunks.length === 0) {
          setRecordingError('No audio data was captured. Please try again.');
          return;
        }
        
        const audioBlob = new Blob(chunks, { type: mimeType });
        setIsTranscribing(true);
        
        try {
          if (!openaiServiceRef.current) {
            throw new Error('OpenAI service is not initialized. Please check your API key in settings.');
          }
          
          // Final transcription of the complete audio
          const finalTranscription = await openaiServiceRef.current.transcribeAudio(audioBlob);
          
          // Update the transcript with the final version
          setTranscript(prev => {
            // Replace the last "You:" segment with the final transcription
            const parts = prev.split('You: ');
            if (parts.length > 1) {
              parts.pop(); // Remove the last part (interim transcription)
              return `${parts.join('You: ')}You: ${finalTranscription}`;
            } else {
              return `${prev}\nYou: ${finalTranscription}`;
            }
          });
          
          // Process the complete transcription for AI analysis
          processInterviewQuestion(finalTranscription);
        } catch (error) {
          console.error('Transcription error:', error);
          setRecordingError(`Failed to transcribe audio: ${error.message || 'Please try again.'}`);
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start(1000); // Collect data every second
      setIsRecording(true);
      if (!sessionStarted) {
        setSessionStarted(true);
      }
    } catch (error) {
      console.error('Error accessing microphone:', error);
      
      // Provide more specific error messages based on the error type
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setRecordingError(
          'Microphone access was denied. Please grant permission in your browser settings and try again.'
        );
      } else if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
        setRecordingError('No microphone found. Please connect a microphone and try again.');
      } else if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
        setRecordingError('Your microphone is busy or not readable. Please close other applications using the microphone.');
      } else if (error.name === 'OverconstrainedError') {
        setRecordingError('Audio constraints cannot be satisfied. Please check your audio settings.');
      } else if (error.name === 'AbortError') {
        setRecordingError('Recording was aborted by the system. Please try again.');
      } else {
        setRecordingError(`Failed to access microphone: ${error.message || 'Please check permissions and try again.'}`);
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      audioStream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
      setAudioStream(null);
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
      // Notify Electron main process that recording has started
      if (api) {
        api.startRecording();
      }
    } else {
      stopRecording();
      // Notify Electron main process that recording has stopped
      if (api) {
        api.stopRecording();
      }
    }
  };
  
  // Process the interview question with AI in real-time
  const processInterviewQuestion = (question) => {
    setIsProcessing(true);
    
    if (!openaiServiceRef.current) {
      setRecordingError('OpenAI service is not initialized. Please check your API key in settings.');
      setIsProcessing(false);
      return;
    }

    // Create a structured prompt for better AI responses
    const prompt = `You are an AI assistant helping with a system design interview. 
    The current interview transcript is about: ${transcript}
    
    The latest question or statement is: "${question}"
    
    Please analyze this and provide:
    1. The main topic of the interview (if clear)
    2. 3-5 helpful suggestions for answering this question
    3. 2-4 potential follow-up questions the interviewer might ask
    4. 2-4 key architecture components or patterns relevant to this design
    
    Format your response as JSON with the following structure:
    {
      "topic": "Main topic of the interview",
      "suggestions": ["suggestion1", "suggestion2", ...],
      "followUpQuestions": ["question1", "question2", ...],
      "architectureNotes": ["component1", "component2", ...]
    }`;
    
    openaiServiceRef.current.generateText(prompt)
      .then(response => {
        try {
          // Parse the AI response
          const parsedResponse = JSON.parse(response);
          if (parsedResponse.topic) setSessionTopic(parsedResponse.topic);
          if (parsedResponse.suggestions) setSuggestions(parsedResponse.suggestions);
          if (parsedResponse.followUpQuestions) setFollowUpQuestions(parsedResponse.followUpQuestions);
          if (parsedResponse.architectureNotes) setArchitectureNotes(parsedResponse.architectureNotes);
        } catch (e) {
          console.error('Error parsing AI response:', e);
          setRecordingError('Failed to parse AI response. Please try again.');
        }
        setIsProcessing(false);
      })
      .catch(error => {
        console.error('Error processing with OpenAI:', error);
        setRecordingError(`Failed to process with OpenAI: ${error.message}`);
        setIsProcessing(false);
      });
  };
  

  
  // Save session for later review
  const saveSession = () => {
    // In a real implementation, this would save to a database or file
    console.log('Saving session...');
    alert('Session saved successfully!');
  };

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        {sessionTopic || 'New Interview Session'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column - Transcript and recording controls */}
        <Grid item xs={12} md={7}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 3, 
              height: '70vh', 
              display: 'flex', 
              flexDirection: 'column'
            }}
          >
            <Typography variant="h6" gutterBottom>
              Interview Transcript
            </Typography>
            
            <Paper 
              variant="outlined" 
              ref={transcriptRef}
              sx={{ 
                p: 2, 
                flexGrow: 1, 
                mb: 2, 
                overflowY: 'auto',
                bgcolor: 'background.default',
                whiteSpace: 'pre-wrap',
                fontSize: '1rem',
                lineHeight: 1.6
              }}
            >
              {transcript || 'Your interview transcript will appear here...'}
              {recordingError && (
                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                  {recordingError}
                </Typography>
              )}
              {isTranscribing && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Transcribing audio...
                </Typography>
              )}
              {isProcessing && (
                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                  <CircularProgress size={20} />
                </Box>
              )}
            </Paper>
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Button
                  variant={isRecording ? "contained" : "outlined"}
                  color={isRecording ? "error" : "primary"}
                  startIcon={isRecording ? <StopIcon /> : <MicIcon />}
                  onClick={toggleRecording}
                  sx={{ mr: 2 }}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
                
                {sessionStarted && (
                  <Button 
                    variant="outlined" 
                    startIcon={<SaveIcon />}
                    onClick={saveSession}
                  >
                    Save Session
                  </Button>
                )}
              </Box>
              

            </Box>
          </Paper>
        </Grid>
        
        {/* Right column - AI assistance */}
        <Grid item xs={12} md={5}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TipsAndUpdatesIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">AI Suggestions</Typography>
              </Box>
              
              {suggestions.length > 0 ? (
                <Box>
                  {suggestions.map((suggestion, index) => (
                    <Chip 
                      key={index}
                      label={suggestion}
                      sx={{ m: 0.5, bgcolor: 'primary.dark' }}
                    />
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Suggestions will appear here once the interview starts...
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <WarningIcon color="warning" sx={{ mr: 1 }} />
                <Typography variant="h6">Potential Follow-ups</Typography>
              </Box>
              
              {followUpQuestions.length > 0 ? (
                <Box>
                  {followUpQuestions.map((question, index) => (
                    <Typography 
                      key={index} 
                      variant="body2" 
                      sx={{ 
                        mb: 1, 
                        p: 1, 
                        bgcolor: 'background.paper', 
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'warning.dark'
                      }}
                    >
                      {question}
                    </Typography>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Potential follow-up questions will appear here...
                </Typography>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ArchitectureIcon color="info" sx={{ mr: 1 }} />
                <Typography variant="h6">Architecture Notes</Typography>
              </Box>
              
              {architectureNotes.length > 0 ? (
                <Box>
                  {architectureNotes.map((note, index) => (
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
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Architecture suggestions will appear here...
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InterviewSession;