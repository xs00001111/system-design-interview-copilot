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
  Chip,
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
  const [recordingError, setRecordingError] = useState('');
  const [audioStream, setAudioStream] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  // Change to:
  // Change to:
  const mediaRecorderRef = useRef(null);
  const transcriptRef = useRef(null);
  const openaiServiceRef = useRef(null);
  const debouncedProcessRef = useRef(null);
  const transcriptionIntervalRef = useRef(null); // Timer for 15-sec transcriptions

  // Initialize OpenAI service with API key from settings or environment
  useEffect(() => {
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
  
  // Scroll transcript to the bottom on update
  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript]);



  // IPC listeners for voice recording
  useEffect(() => {
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
      return () => {
        api.removeAllListeners('start-recording-browser');
        api.removeAllListeners('stop-recording-browser');
      };
    }
  }, [isRecording]);

  const processInterviewQuestion = (question, fullTranscript) => {
    setIsProcessing(true);
    
    if (!openaiServiceRef.current) {
      setRecordingError('OpenAI service is not initialized. Please check your API key in settings.');
      setIsProcessing(false);
      return;
    }

    const prompt = `You are an AI assistant helping with a system design interview. 
  The current interview transcript is:
  ${fullTranscript}
  
  The latest transcription is: "${question}"
  
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
          const jsonMatch = response.match(/\{[\s\S]*\}/);
          if (!jsonMatch) throw new Error('Invalid JSON format');
          const parsedResponse = JSON.parse(jsonMatch[0]);
          if (!parsedResponse.topic || !parsedResponse.suggestions) throw new Error('Invalid response structure');
          if (parsedResponse.topic) setSessionTopic(parsedResponse.topic);
          if (parsedResponse.suggestions) setSuggestions(parsedResponse.suggestions);
          if (parsedResponse.followUpQuestions) setFollowUpQuestions(parsedResponse.followUpQuestions);
          if (parsedResponse.architectureNotes) setArchitectureNotes(parsedResponse.architectureNotes);
          console.log('Updated AI feedback:', JSON.stringify(parsedResponse, null, 2));
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
    console.log('Saving session...');
    alert('Session saved successfully!');
  };

  const startRecording = async () => {
    setRecordingError('');
    
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setRecordingError('Your browser does not support audio recording. Please try a modern browser like Chrome or Firefox.');
      return;
    }
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      setAudioStream(stream);

      if (!window.MediaRecorder) {
        setRecordingError('Your browser does not support MediaRecorder API. Please try a modern browser.');
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      // Determine MIME type based on browser support
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      console.log("Using MIME type:", mimeType);
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

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
      debouncedProcessRef.current = debounce((text) => {
        processInterviewQuestion(text);
      }, 1500);
      
      const chunks = [];

      if (openaiServiceRef.current) {
        openaiServiceRef.current.clearTranscriptionBuffer();
        openaiServiceRef.current.setTranscriptionCallback((text) => {
          if (text && text.trim()) {
            console.log('Real-time transcript update:', {
              text: text,
              timestamp: Date.now(),
              prevTranscriptLength: transcript.length
            });
            setTranscript(prev => prev + '\nYou: ' + text);
          }
        });
      }

      recorder.ondataavailable = async (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

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
        
        // Convert accumulated chunks into a Blob for transcription
        const audioBlob = new Blob(chunks, { type: mimeType });
        
        setIsTranscribing(true);
        try {
          const finalTranscription = await openaiServiceRef.current.transcribeAudio(audioBlob);
          setTranscript(prev => prev + '\nFinal: ' + finalTranscription);
          processInterviewQuestion(finalTranscription);
        } catch (error) {
          console.error('Final transcription error:', error);
          setRecordingError(`Failed to transcribe audio: ${error.message || 'Please try again.'}`);
        } finally {
          setIsTranscribing(false);
        }
        if (transcriptionIntervalRef.current) {
          clearInterval(transcriptionIntervalRef.current);
          transcriptionIntervalRef.current = null;
        }
      };

      recorder.start(2000);
      setIsRecording(true);
      if (!sessionStarted) {
        setSessionStarted(true);
      }

      // Set up a timer to process intermediate transcription every 15 seconds.
      transcriptionIntervalRef.current = setInterval(async () => {
        console.log('15-second interval processing');

        // Only process if we're still recording
        if (true) {
          console.log("Recording!!!")
          // Stop current recording to process accumulated audio
          stopRecording();
          
          // Convert accumulated chunks into a Blob for transcription
          const audioBlob = new Blob(chunks, { type: mimeType });
          setIsTranscribing(true);
          console.log("start transcribing");
          try {
            const intermediateTranscription = await openaiServiceRef.current.transcribeAudio(audioBlob);
            console.log('15 second interval transcription:', intermediateTranscription);
            
            if (intermediateTranscription && intermediateTranscription.trim()) {
              setTranscript(prev => prev + '\n[Interval]: ' + intermediateTranscription);
              processInterviewQuestion(intermediateTranscription, transcript);
            }
          } catch (error) {
            console.error('Error transcribing interval audio:', error);
            setRecordingError(`Failed to transcribe audio: ${error.message || 'Please try again.'}`);
          } finally {
            setIsTranscribing(false);
          }
          
          // Start a new recording session
          startRecording();
        }
      }, 15000); // 15 second intervals
    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        setRecordingError('Microphone access was denied. Please grant permission in your browser settings and try again.');
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
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      audioStream?.getTracks()?.forEach(track => track.stop());
      setIsRecording(false);
      setAudioStream(null);
      if (transcriptionIntervalRef.current) {
        clearInterval(transcriptionIntervalRef.current);
        transcriptionIntervalRef.current = null;
      }
    }
  };

  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
      if (api) {
        api.startRecording();
      }
    } else {
      stopRecording();
      if (api) {
        api.stopRecording();
      }
    }
  };

  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        {sessionTopic || 'New Interview Session'}
      </Typography>
      
      <Grid container spacing={3}>
        {/* Left column – Transcript and recording controls */}
        <Grid item xs={12} md={7}>
          <Paper elevation={3} sx={{ p: 3, height: '70vh', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" gutterBottom>
              Interview Transcript
            </Typography>
            <Paper 
              variant="outlined" 
              ref={transcriptRef}
              sx={{ p: 2, flexGrow: 1, mb: 2, overflowY: 'auto', bgcolor: 'background.default', whiteSpace: 'pre-wrap' }}
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
                  <Button variant="outlined" startIcon={<SaveIcon />} onClick={saveSession}>
                    Save Session
                  </Button>
                )}
              </Box>
            </Box>
          </Paper>
        </Grid>
        
        {/* Right column – AI assistance */}
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
                    <Chip key={index} label={suggestion} sx={{ m: 0.5, bgcolor: 'primary.dark' }} />
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
                      sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'warning.dark' }}
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
                      sx={{ mb: 1, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: '1px solid', borderColor: 'info.dark' }}
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
