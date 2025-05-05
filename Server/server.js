// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { SpeechClient } = require('@google-cloud/speech');
const cors = require('cors');
require('dotenv').config();

const { OpenAI } = require("openai");

// NEW: Import the YoutubeTranscript package for fetching YouTube transcripts
const { YoutubeTranscript } = require('youtube-transcript');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  // Replace with your own key or use process.env if you like
  apiKey: process.env.OPENAI_API_KEY,
});

// ===========================
//  /api/summarize Endpoint
// ===========================
app.post('/api/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });
  console.log("Summarize request received");

  try {
    // A new prompt that emphasizes ultra-readable bullet points,
    // minimal text, and rapid consumption of essential information.
    const prompt = `
Summarize the following text into a laser-focused, ultra-readable bullet point list:
• Aim for minimal words and maximum clarity.
• Keep each bullet to one main idea.
• Indent sub-bullets for related or supporting points.
• Eliminate filler phrases or lengthy transitions.
• Use consistent symbols or dashes to visually separate ideas.
• Provide an instant-grab of key facts and insights.
• Take up as little vertical space as possible.
• Translate to english if necessary.

Text:
${text}

Lightning-Fast Summary:
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "assistant",
          content:
            "You are an unstoppable summarizer. Transform any text into short, rapid-fire bullet points. " +
            "Place closely related details as indented sub-bullets. No fluff or filler—just clean, minimal lines " +
            "that let someone skim and grasp the essentials in seconds. No new lines between points and their sub points."
        },
        { role: "user", content: prompt }
      ],
    });

    const summary = response.choices[0].message;
    res.json({ summary });
  } catch (error) {
    console.error("Error calling OpenAI API (summarize):", error);
    res.status(500).json({ error: "Failed to summarize text" });
  }
});

// ===========================
//  /api/developer Endpoint
// ===========================
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
            "If providing pseudo code, leave comments in the code about what everything is doing and why you are doing it. " +
            "Omit unnecessary details."
        },
        { role: "user", content: prompt }
      ],
    });

    const answer = response.choices[0].message;
    res.json({ answer });
  } catch (error) {
    console.error("Error calling OpenAI API (developer):", error);
    res.status(500).json({ error: "Failed to process the developer question" });
  }
});

// ===========================
//  /api/punctuate Endpoint
// ===========================
app.post('/api/punctuate', async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ error: "No text provided" });
  console.log("Punctuate request received: ", text);

  try {
    // Use the same prompt from your original streaming code
    const punctuationPrompt = `
      Correct grammar, punctuation, and capitalization in the following text.
      Make sure each sentence ends with proper punctuation.
      Start each sentence with a capital letter.
      Insert new paragraphs where a new idea starts.
      Do not include any quotation marks.
      Raw text:
      ${text.trim()}
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content:
            "You are an editor. Fix grammar, punctuation, and capitalization. Break text into paragraphs when ideas change. " +
            "Output only the revised text without quotes or additional commentary."
        },
        { role: "user", content: punctuationPrompt }
      ],
    });

    const punctuatedText = response.choices[0].message.content.trim();
    res.json({ punctuated: punctuatedText });
  } catch (error) {
    console.error("Error calling OpenAI API (punctuate):", error);
    res.status(500).json({ error: "Failed to punctuate text" });
  }
});

// ===========================
//  NEW /api/youtubeTranscript Endpoint
// ===========================
// This endpoint accepts a videoId as a URL parameter and uses the YoutubeTranscript package 
// to fetch the transcript on the server side (bypassing CORS issues).
app.get('/api/youtubeTranscript/:videoId', async (req, res) => {
  const { videoId } = req.params;
  console.log(`Fetching transcript for videoId: ${videoId}`);

  try {
    // Fetch the transcript using the server-side YoutubeTranscript API
    const transcriptData = await YoutubeTranscript.fetchTranscript(videoId);
    // Wrap the returned transcript in an object for consistency
    res.json({ transcript: transcriptData });
  } catch (error) {
    console.error("Error fetching YouTube transcript:", error);
    res.status(500).json({ error: "Unable to fetch transcript" });
  }
});

// ===========================
//  Google Cloud Speech Setup
// ===========================
const speechClient = new SpeechClient({
  credentials: JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS),
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*' },
});

// ===========================
//      Socket.IO Events
// ===========================
io.on('connection', (socket) => {
  let recognizeStream = null;

  // -- Start Streaming to Google Cloud
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
        console.error(
          `Error in Google Cloud recognize stream for ${socket.id} with config ${JSON.stringify(
            config,
            null,
            2
          )}:`,
          err
        );
        socket.emit('googleCloudStreamError', err.message);
      })
      .on("data", (data) => {
        const alt = data.results?.[0]?.alternatives?.[0];
        if (!alt) return;

        const transcript = alt.transcript;
        const isFinal = data.results[0].isFinal;
        
        // Now we ONLY emit raw transcript (punctuation is handled in /api/punctuate from the client)
        socket.emit("speechData", { transcript, isFinal });
      });
  });

  // -- Send streamed audio chunks to Google Cloud
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

  // -- Stop Google Cloud Stream
  socket.on('stopGoogleCloudStream', () => {
    if (recognizeStream) {
      recognizeStream.end();
      recognizeStream = null;
    } else {
      console.warn('stopGoogleCloudStream called but recognizeStream was already null.');
    }
  });

  // -- Handle disconnect
  socket.on('disconnect', () => {
    if (recognizeStream) {
      console.log('Client disconnected:', socket.id);
      recognizeStream.end();
      recognizeStream = null;
    }
  });
});

// ===========================
//  Server Listen
// ===========================
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
