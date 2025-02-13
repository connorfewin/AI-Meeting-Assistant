// server.js

//------------------------------------------------------
// 1. Imports & Setup
//------------------------------------------------------
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const cors = require('cors');
const axios = require('axios');  // Import axios for HTTP requests

// Create an Express app
const app = express();
app.use(cors());

// (Optional) If you want to serve a built React app in production:
// app.use(express.static('../my-ai-meeting-frontend/build'));

// Create an HTTP server and attach Socket.io
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // In production, restrict this to your domain
  },
});

//------------------------------------------------------
// 2. Google Cloud Speech Client
//------------------------------------------------------
const speechClient = new SpeechClient({
  keyFilename: 'C:/Users/cjfew/Desktop/Code/AI-Meeting-Assistant/Server/.env/ultimate-flame-291020-dfe641a1746c.json',
});

//------------------------------------------------------
// 3. Socket.io Connection & Streams
//------------------------------------------------------
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  let recognizeStream = null;

  // When the client starts streaming to Google Cloud
  socket.on('startGoogleCloudStream', () => {
    console.log('Starting Google Cloud Stream for', socket.id);

    // Create a streamingRecognize stream to Google Speech-to-Text
    recognizeStream = speechClient
      .streamingRecognize({
        config: {
          encoding: 'LINEAR16',
          sampleRateHertz: 48000,
          languageCode: 'en-US',
        },
        interimResults: true,
      })
      .on('error', (err) => {
        console.error('Error in Google Cloud recognize stream:', err);
        socket.emit('googleCloudStreamError', err.message);
      })
      .on('data', async (data) => {
        if (data.results[0] && data.results[0].alternatives[0]) {
          const transcript = data.results[0].alternatives[0].transcript;
          const isFinal = data.results[0].isFinal;
          
          if (isFinal) {
            // When a final transcript is received, call the punctuation restoration service
            try {
              const response = await axios.post('http://localhost:8001/punctuate', {
                text: transcript.trim(),
              });
              const punctuatedText = response.data.punctuated_text;
              // Emit the punctuated transcript to the client
              socket.emit('speechData', { transcript: punctuatedText, isFinal });
            } catch (error) {
              console.error('Punctuation restoration error:', error);
              // If there's an error, fall back to the raw transcript
              socket.emit('speechData', { transcript, isFinal });
            }
          } else {
            // For partial results, just emit them as they are
            socket.emit('speechData', { transcript, isFinal });
          }
        }
      });
  });

  // Receive raw audio from the client and write it to the recognition stream
  socket.on('sendAudioData', (audioChunk) => {
    if (recognizeStream) {
      recognizeStream.write(audioChunk);
    }
  });

  // When the client stops streaming
  socket.on('stopGoogleCloudStream', () => {
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  });

  // On client disconnect, clean up any open streams
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  });
});

//------------------------------------------------------
// 4. Start the Server
//------------------------------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
