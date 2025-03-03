import React, { useState, useEffect } from 'react';
import { Box, Typography, Dialog, DialogTitle, DialogContent, Grid, Card, CardMedia, CardActionArea, Button, Snackbar, Alert } from '@mui/material';

// For Electron IPC communication via preload script
const api = window.api;

const ScreenCapture = () => {
  const [sources, setSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState(null);
  const [screenshot, setScreenshot] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    // Set up IPC listeners for screenshot functionality
    if (api) {
      // Listen for screenshot sources from main process
      api.onScreenshotSources((sources) => {
        setSources(sources);
        setShowDialog(true);
      });

      // Listen for process screenshots command
      api.onProcessScreenshots(() => {
        if (screenshot) {
          processScreenshot(screenshot);
        } else {
          setNotification({
            open: true,
            message: 'No screenshot available to process',
            severity: 'warning'
          });
        }
      });

      // Clean up listeners on unmount
      return () => {
        api.removeAllListeners('screenshot-sources');
        api.removeAllListeners('process-screenshots');
      };
    }
  }, [screenshot]);

  const handleSourceSelect = (source) => {
    setSelectedSource(source);
    captureScreenshot(source);
  };

  const captureScreenshot = async (source) => {
    try {
      // Create a video element to capture the stream
      const video = document.createElement('video');
      video.style.cssText = 'position:absolute; top:-10000px; left:-10000px;';
      
      // Add video to DOM to make it work in some browsers
      document.body.appendChild(video);

      // Get media stream for the source
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
            minWidth: 1280,
            maxWidth: 1920,
            minHeight: 720,
            maxHeight: 1080
          }
        }
      });

      video.srcObject = stream;
      video.onloadedmetadata = () => {
        video.play();
        setTimeout(() => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const dataUrl = canvas.toDataURL('image/png');
          setScreenshot(dataUrl);
          
          // Stop all video tracks
          stream.getTracks().forEach(track => track.stop());
          document.body.removeChild(video);
          
          setShowDialog(false);
          setNotification({
            open: true,
            message: 'Screenshot captured successfully!',
            severity: 'success'
          });
        }, 100);
      };
    } catch (error) {
      console.error('Error capturing screenshot:', error);
      setNotification({
        open: true,
        message: `Error capturing screenshot: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const processScreenshot = (screenshotData) => {
    // Here you would implement your screenshot processing logic
    // For example, OCR processing, image analysis, etc.
    console.log('Processing screenshot...');
    
    // Mock processing result
    setTimeout(() => {
      setNotification({
        open: true,
        message: 'Screenshot processed successfully!',
        severity: 'success'
      });
    }, 1500);
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  const handleCaptureManually = () => {
    if (api) {
      api.captureScreenshot();
    }
  };

  return (
    <>
      {/* Source selection dialog */}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Select Screen to Capture</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {sources.map((source) => (
              <Grid item xs={6} md={4} key={source.id}>
                <Card>
                  <CardActionArea onClick={() => handleSourceSelect(source)}>
                    <CardMedia
                      component="img"
                      height="140"
                      image={source.thumbnail.toDataURL()}
                      alt={source.name}
                    />
                    <Typography variant="body2" align="center" padding={1}>
                      {source.name}
                    </Typography>
                  </CardActionArea>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
      </Dialog>

      {/* Notification snackbar */}
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000} 
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseNotification} severity={notification.severity}>
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Optional: Button to manually trigger screenshot */}
      <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000, display: 'none' }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={handleCaptureManually}
        >
          Capture Screen
        </Button>
      </Box>
    </>
  );
};

export default ScreenCapture;