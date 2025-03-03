import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Switch,
  FormControlLabel,
  Slider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  Button,
  Divider,
  Alert
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import SettingsVoiceIcon from '@mui/icons-material/SettingsVoice';
import LanguageIcon from '@mui/icons-material/Language';
import StorageIcon from '@mui/icons-material/Storage';

const Settings = () => {
  // Audio settings
  const [microphoneInput, setMicrophoneInput] = useState('Default');
  const [audioQuality, setAudioQuality] = useState(2); // Medium quality
  const [noiseReduction, setNoiseReduction] = useState(true);
  const [speechProvider, setSpeechProvider] = useState('whisper');
  const [speechApiKey, setSpeechApiKey] = useState('');
  
  // AI settings
  const [aiModel, setAiModel] = useState('gpt-4');
  const [responseSpeed, setResponseSpeed] = useState(1); // 1 = balanced
  const [suggestionsCount, setSuggestionsCount] = useState(4);
  
  // Privacy settings
  const [saveTranscripts, setSaveTranscripts] = useState(true);
  const [shareAnonymousData, setShareAnonymousData] = useState(false);
  const [dataRetentionDays, setDataRetentionDays] = useState(30);
  
  // UI settings
  const [darkMode, setDarkMode] = useState(true);
  const [language, setLanguage] = useState('en');
  
  // API settings
  const [apiKey, setApiKey] = useState('');
  
  // Save settings
  const saveSettings = async () => {
    // Save API key to localStorage and .env file
    if (apiKey) {
      localStorage.setItem('openai_api_key', apiKey);
      
      try {
        // Save API key to .env file using fs module via IPC
        if (window.api) {
          await window.api.saveApiKey(apiKey);
          // Redirect to main page after successful save
          window.location.href = '/';
        }
      } catch (error) {
        console.error('Failed to save API key:', error);
        alert('Failed to save API key. Please try again.');
        return;
      }
    }
    
    // Save other settings to localStorage
    localStorage.setItem('settings', JSON.stringify({
      microphoneInput,
      audioQuality,
      noiseReduction,
      speechProvider,
      aiModel,
      responseSpeed,
      suggestionsCount,
      saveTranscripts,
      shareAnonymousData,
      dataRetentionDays,
      darkMode,
      language
    }));
    
    console.log('Saving settings...');
    alert('Settings saved successfully!');
  };
  
  // Clear all data
  const clearAllData = () => {
    if (window.confirm('Are you sure you want to clear all your data? This action cannot be undone.')) {
      // In a real app, this would clear user data
      console.log('Clearing all data...');
      alert('All data has been cleared.');
    }
  };
  
  return (
    <Box sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      
      <Grid container spacing={3}>
        {/* Audio Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SettingsVoiceIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Audio Settings</Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="microphone-input-label">Microphone Input</InputLabel>
                <Select
                  labelId="microphone-input-label"
                  value={microphoneInput}
                  label="Microphone Input"
                  onChange={(e) => setMicrophoneInput(e.target.value)}
                >
                  <MenuItem value="Default">Default System Microphone</MenuItem>
                  <MenuItem value="External">External Microphone</MenuItem>
                  <MenuItem value="Headset">Headset Microphone</MenuItem>
                </Select>
              </FormControl>
              
              <Typography gutterBottom>Audio Quality</Typography>
              <Slider
                value={audioQuality}
                min={1}
                max={3}
                step={1}
                marks={[
                  { value: 1, label: 'Low' },
                  { value: 2, label: 'Medium' },
                  { value: 3, label: 'High' },
                ]}
                onChange={(e, newValue) => setAudioQuality(newValue)}
                sx={{ mb: 3 }}
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={noiseReduction} 
                    onChange={(e) => setNoiseReduction(e.target.checked)} 
                  />
                }
                label="Noise Reduction"
              />
            </CardContent>
          </Card>
          
          {/* Privacy Settings */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <SecurityIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Privacy Settings</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={saveTranscripts} 
                    onChange={(e) => setSaveTranscripts(e.target.checked)} 
                  />
                }
                label="Save Interview Transcripts"
                sx={{ mb: 2, display: 'block' }}
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={shareAnonymousData} 
                    onChange={(e) => setShareAnonymousData(e.target.checked)} 
                  />
                }
                label="Share Anonymous Usage Data to Improve Service"
                sx={{ mb: 2, display: 'block' }}
              />
              
              <Typography gutterBottom>Data Retention Period (days)</Typography>
              <Slider
                value={dataRetentionDays}
                min={7}
                max={90}
                step={1}
                marks={[
                  { value: 7, label: '7' },
                  { value: 30, label: '30' },
                  { value: 90, label: '90' },
                ]}
                onChange={(e, newValue) => setDataRetentionDays(newValue)}
                sx={{ mb: 3 }}
              />
              
              <Button 
                variant="outlined" 
                color="error" 
                startIcon={<DeleteIcon />}
                onClick={clearAllData}
              >
                Clear All My Data
              </Button>
            </CardContent>
          </Card>
        </Grid>
        
        {/* AI and UI Settings */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <StorageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">AI Assistant Settings</Typography>
              </Box>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="ai-model-label">AI Model</InputLabel>
                <Select
                  labelId="ai-model-label"
                  value={aiModel}
                  label="AI Model"
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  <MenuItem value="gpt-4">GPT-4 (Recommended)</MenuItem>
                  <MenuItem value="gpt-3.5">GPT-3.5 Turbo (Faster)</MenuItem>
                  <MenuItem value="claude">Claude 2</MenuItem>
                </Select>
              </FormControl>
              
              <Typography gutterBottom>Response Speed vs. Quality</Typography>
              <Slider
                value={responseSpeed}
                min={0}
                max={2}
                step={1}
                marks={[
                  { value: 0, label: 'Quality' },
                  { value: 1, label: 'Balanced' },
                  { value: 2, label: 'Speed' },
                ]}
                onChange={(e, newValue) => setResponseSpeed(newValue)}
                sx={{ mb: 3 }}
              />
              
              <Typography gutterBottom>Number of Suggestions</Typography>
              <Slider
                value={suggestionsCount}
                min={2}
                max={8}
                step={1}
                marks={[
                  { value: 2, label: '2' },
                  { value: 4, label: '4' },
                  { value: 6, label: '6' },
                  { value: 8, label: '8' },
                ]}
                onChange={(e, newValue) => setSuggestionsCount(newValue)}
              />
            </CardContent>
          </Card>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <LanguageIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">UI Settings</Typography>
              </Box>
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={darkMode} 
                    onChange={(e) => setDarkMode(e.target.checked)} 
                  />
                }
                label="Dark Mode"
                sx={{ mb: 2, display: 'block' }}
              />
              
              <FormControl fullWidth>
                <InputLabel id="language-label">Language</InputLabel>
                <Select
                  labelId="language-label"
                  value={language}
                  label="Language"
                  onChange={(e) => setLanguage(e.target.value)}
                >
                  <MenuItem value="en">English</MenuItem>
                  <MenuItem value="zh">Chinese (中文)</MenuItem>
                  <MenuItem value="es">Spanish (Español)</MenuItem>
                  <MenuItem value="fr">French (Français)</MenuItem>
                  <MenuItem value="de">German (Deutsch)</MenuItem>
                </Select>
              </FormControl>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">API Settings</Typography>
              </Box>
              
              <Alert severity="info" sx={{ mb: 2 }}>
                Enter your OpenAI API key to use OpenAI's services (GPT and Whisper) for better performance.
              </Alert>
              
              <TextField
                fullWidth
                label="OpenAI API Key"
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                sx={{ mb: 3 }}
              />
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="speech-provider-label">Speech Recognition Provider</InputLabel>
                <Select
                  labelId="speech-provider-label"
                  value={speechProvider}
                  label="Speech Recognition Provider"
                  onChange={(e) => setSpeechProvider(e.target.value)}
                >
                  <MenuItem value="whisper">OpenAI Whisper (Uses OpenAI API Key)</MenuItem>
                  <MenuItem value="google">Google Speech-to-Text</MenuItem>
                  <MenuItem value="azure">Azure Speech Services</MenuItem>
                </Select>
              </FormControl>
              
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="ai-model-label">AI Model</InputLabel>
                <Select
                  labelId="ai-model-label"
                  value={aiModel}
                  label="AI Model"
                  onChange={(e) => setAiModel(e.target.value)}
                >
                  <MenuItem value="gpt-4">GPT-4 (Recommended)</MenuItem>
                  <MenuItem value="gpt-3.5">GPT-3.5 Turbo (Faster)</MenuItem>
                  <MenuItem value="claude">Claude 2</MenuItem>
                </Select>
              </FormControl>
              
              <Typography gutterBottom>Response Speed vs. Quality</Typography>
              <Slider
                value={responseSpeed}
                min={0}
                max={2}
                step={1}
                marks={[
                  { value: 0, label: 'Quality' },
                  { value: 1, label: 'Balanced' },
                  { value: 2, label: 'Speed' },
                ]}
                onChange={(e, newValue) => setResponseSpeed(newValue)}
                sx={{ mb: 3 }}
              />
              
              <Typography gutterBottom>Number of Suggestions</Typography>
              <Slider
                value={suggestionsCount}
                min={2}
                max={8}
                step={1}
                marks={[
                  { value: 2, label: '2' },
                  { value: 4, label: '4' },
                  { value: 6, label: '6' },
                  { value: 8, label: '8' },
                ]}
                onChange={(e, newValue) => setSuggestionsCount(newValue)}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
        <Button 
          variant="contained" 
          size="large" 
          startIcon={<SaveIcon />}
          onClick={saveSettings}
        >
          Save Settings
        </Button>
      </Box>
    </Box>
  );
};

export default Settings;