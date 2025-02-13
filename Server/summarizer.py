# summarizer.py
from fastapi import FastAPI
from pydantic import BaseModel
from transformers import pipeline

app = FastAPI()

# Use a light and fast summarization model; you can experiment with others.
summarizer = pipeline("summarization", model="sshleifer/distilbart-cnn-12-6")

class Transcript(BaseModel):
    text: str

@app.post("/summarize")
async def summarize(transcript: Transcript):
    summary = summarizer(transcript.text, max_length=150, min_length=40, do_sample=False)
    return {"summary": summary[0]['summary_text']}
