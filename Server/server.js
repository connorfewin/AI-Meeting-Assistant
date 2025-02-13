// server.js

//------------------------------------------------------
// 1. Imports & Initial Setup
//------------------------------------------------------
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

// Use destructuring to import from OpenAI
const { OpenAI } = require("openai");

// Create Express app and configure middleware
const app = express();
app.use(cors());
app.use(express.json());

//------------------------------------------------------
// 2. OpenAI API Client & Summarization Endpoint
//------------------------------------------------------
const openai = new OpenAI({apiKey: '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'});

app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });
  console.log("Summarize");
  try {
    const prompt = `Simplify and organize the following text into a concise summary:\n\n${text}\n\nSummary:`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "assistant", content: "You are a helpful note taker that simplifies and organizes the following text into a concise summary. Provide solid note taking strucutre so your notes are readable." },
        {
            role: "user",
            content: prompt,
        },
    ],
    });
    const summary = response.choices[0].message;
    res.json({ summary });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to summarize text" });
  }
});

//------------------------------------------------------
// 3. Google Cloud Speech Client
//------------------------------------------------------
const speechClient = new SpeechClient({
  keyFilename: 'C:/Users/cjfew/Desktop/Code/AI-Meeting-Assistant/Server/sensitive/ultimate-flame-291020-dfe641a1746c.json',
});

//------------------------------------------------------
// 4. Socket.io Connection & Speech Streams
//------------------------------------------------------
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' } // Restrict this in production
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let recognizeStream = null;

  // Start the Google Cloud Speech stream when requested
  socket.on('startGoogleCloudStream', () => {
    console.log('Starting Google Cloud Stream for', socket.id);
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
            try {
              const response = await axios.post('http://localhost:8001/punctuate', {
                text: transcript.trim(),
              });
              const punctuatedText = response.data.punctuated_text;
              socket.emit('speechData', { transcript: punctuatedText, isFinal });
            } catch (error) {
              console.error('Punctuation restoration error:', error);
              socket.emit('speechData', { transcript, isFinal });
            }
          } else {
            socket.emit('speechData', { transcript, isFinal });
          }
        }
      });
  });

  // Forward raw audio data to the recognition stream
  socket.on('sendAudioData', (audioChunk) => {
    if (recognizeStream) recognizeStream.write(audioChunk);
  });

  // End the speech stream when requested
  socket.on('stopGoogleCloudStream', () => {
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  });

  // Clean up when the client disconnects
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    }
  });
});

//------------------------------------------------------
// 5. Start the Server
//------------------------------------------------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
