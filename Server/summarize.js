// api/summarize.js
const express = require('express');
const router = express.Router();
const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

// Configure OpenAI with your API key (set OPENAI_API_KEY in your .env file)
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

router.post('/summarize', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "No text provided" });
  }
  try {
    // Create a prompt for GPT summarization
    const prompt = `Simplify and organize the following text into a concise summary:\n\n${text}\n\nSummary:`;
    const response = await openai.createCompletion({
      model: "text-davinci-003", // You can change this to a different model if needed.
      prompt,
      max_tokens: 150,          // Adjust max_tokens based on how long you expect the summary to be.
      temperature: 0.5,         // Lower temperature for more deterministic output.
    });
    const summary = response.data.choices[0].text.trim();
    res.json({ summary });
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).json({ error: "Failed to summarize text" });
  }
});

module.exports = router;
