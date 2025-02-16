const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const { OpenAI } = require("openai");

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: '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' });

app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });
  console.log("Summarize");
  try {
    const prompt = `Simplify and organize the following text into a concise summary:\n\n${text}\n\nSummary:`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "assistant", content: "You are an efficient note-taker. Capture key points, decisions, and action items accurately. Simplify and organize discussions for quick catch-up. Use clear structure but avoid fluff—headers when useful, bullets for clarity, and concise phrasing. No filler words, just essential takeaways." },
        { role: "user", content: prompt }
      ],
    });
    const summary = response.choices[0].message;
    res.json({ summary });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to summarize text" });
  }
});

app.post('/api/developer', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });
  console.log("Developer question received");
  try {
    const prompt = `Problem: ${text}\n
Provide only the minimal information needed to answer this problem. 
- If it's a coding problem, include concise Java pseudocode.
- If not, answer briefly in bullet points.
Avoid extra details.`;
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a technical interview coach. Your responses must be extremely concise—only the essentials. " +
            "Include minimal bullet points and Java pseudocode when it helps. " +
            "If providing pseudo code, leave comments in the code about what everything is doing and why you are doing it. Omit unnecessary details.",
        },
        { role: "user", content: prompt }
      ],
    });
    const answer = response.choices[0].message;
    res.json({ answer });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to process the developer question" });
  }
});

const speechClient = new SpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS)
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' }
});

io.on('connection', (socket) => {
  let recognizeStream = null;

  socket.on('startGoogleCloudStream', () => {
    const config = {
      encoding: 'LINEAR16',
      sampleRateHertz: 48000,
      languageCode: 'en-US',
    };

    recognizeStream = speechClient
      .streamingRecognize({
        config,
        interimResults: true,
      })
      .on('error', (err) => {
        console.error(`Error in Google Cloud recognize stream for ${socket.id} with config ${JSON.stringify(config, null, 2)}:`, err);
        socket.emit('googleCloudStreamError', err.message);
      })
      .on('data', async (data) => {
        if (data.results && data.results[0] && data.results[0].alternatives && data.results[0].alternatives[0]) {
          const transcript = data.results[0].alternatives[0].transcript;
          const isFinal = data.results[0].isFinal;
          if (isFinal) {
            try {
              const punctuationPrompt = `Please add appropriate punctuation and capitalization to the following transcript: "${transcript.trim()}"`;
              const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                  { role: "system", content: "You are an editor that restores gramatical punctuation and proper capitalization to text. Dont use quotations marks." },
                  { role: "user", content: punctuationPrompt }
                ],
              });
              const punctuatedText = response.choices[0].message.content.trim();
              socket.emit('speechData', { transcript: punctuatedText, isFinal });
            } catch (error) {
              console.error('Punctuation restoration error with GPT:', error);
              socket.emit('speechData', { transcript, isFinal });
            }
          } else {
            socket.emit('speechData', { transcript, isFinal });
          }
        } else {
          console.log('Received data with unexpected format:', data);
        }
      });
  });

  socket.on('sendAudioData', (audioChunk) => {
    if (recognizeStream) {
      try {
        recognizeStream.write(audioChunk);
      } catch (err) {
        console.error('Error writing audio chunk to recognizeStream:', err);
      }
    } else {
      console.warn('Attempted to write audio data, but recognizeStream is null.');
    }
  });

  socket.on('stopGoogleCloudStream', () => {
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    } else {
      console.warn('stopGoogleCloudStream called but recognizeStream was already null.');
    }
  });

  socket.on('disconnect', () => {
    if (recognizeStream) {
      console.log('Client disconnected:', socket.id);
      recognizeStream.end();
      recognizeStream = null;
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
