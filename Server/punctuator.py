from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

from deepmultilingualpunctuation import PunctuationModel

model = PunctuationModel()

class Transcript(BaseModel):
    text: str

@app.post("/punctuate")
async def punctuate(transcript: Transcript):
    result = model.restore_punctuation(transcript.text)
    return {"punctuated_text": result}
