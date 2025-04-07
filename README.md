# AI Meeting Assistant - Development Roadmap

## **1. Core UI & Structure**
- [x] Create a single UI with:
  - [x] **Live Transcription & Summarization Window** (for meeting notes).
  - [x] **AI Query Button & Response Window** (for on-demand GPT responses).
  - [x] **Start/Stop buttons** for both features.


---

## **2. Speech-to-Text System**
- [x] Capture external audio (microphone/system audio).
- [x] Process audio through **Google Cloud Speech-to-Text**.
- [x] Display real-time transcription in the UI.

---

## **3. Live Summarization (Meeting Notes)**
- [x] Use NLP models to continuously restore punctuation to the text.
- [x] Create line breaks on pauses
- [x] Use GPT to summarize paragraphs
  - Something cool would be if each paragrpah rendered in its own component (just in a box). It will automatically summarize big ones I guess, but if you click a box it will automatically summarize that content, but if you click in between two boxes it will join their ideas together.
  - I guess you would also need a way to seperate ideas too. Just something to consider.
  - Maybe this is a pure manual mode, but at that point you are basically listening to the conversation, which defys the purpose.
- [x] Dynamically update UI with key points.
- [x] Optimize for low latency and useful insights.

---

## **4. AI Query Feature (On-Demand Responses)**
- [x] Implement a **secondary UI section** with a button to trigger AI queries.
- [x] Once the button is pressed:
  - [x] Capture the next spoken phrase.
  - [x] Send it as a structured GPT request.
  - [x] Display GPT’s response in a separate answer window.
- [x] Allow stopping/resetting queries easily.

---

## **5.1: Video Recording/Lecture**
- [x] Record audio in one long succession
- [x] Punctuate in bulk (on pause of audio (pausing video))
- [x] Handle long pauses without recorded audio (might be a bug)

## **5.2: Lecture Notes**
- [x] Punctuated transcript with broken up paragraphs
- [x] Sperate each paragraph into an array of paragraphs
- [x] Summarize each paragraph in a notes style
- [x] Improve Summarization prompt (more concise)
- [x] Only summarize new paragraphs (keep track of paragraphs that have been summarized)
- [x] Highlight corresponding transcript paragraph hovering notes
- [x] Auto focus for transcript highlight mode
- [x] Copy notes to clipboard

## **5.3: Youtube Videos**
- [ ] Youtube button
- [ ] URL Upload modal
- [ ] Fetch transcript
- [ ] Punctuate transript
- [ ] Display punctuated transcript
- [ ] Get/Notes Notes

## **5.4: Batch Audio Transription**
_Googles Speech to Text has a 305 second cap on audio transcription. This causes the user to have to reshare their screen every 5 minutes. We are going to shift to using a batch transcription by capturing all the audio first and then transcribing all of it. This will save money and effort from the user_
- [ ] Record batch audio
- [ ] Transcribe audio
- [ ] Mic integration for potenial user input
- [ ] Puncuate Transript
- [ ] Display punctuated transcript
- [ ] Get/Show Notes
- [ ] Audio visualizer for the UI while audio is being recorded
---

## **6. Meeting** 
- [x] Capture audio from meetings / videos (Screen share capture)
- [ ] Tag transcriptions with speaker labels.
- [ ] Ensure correct speaker attribution for both summarization and AI queries.

---

## **7. Final Optimizations & Enhancements**
- [ ] Improve processing speed and UI responsiveness.
- [x] Production version
- [ ] Regenerate Notes Modal (Avoid Spamming)
- [ ] Have brain build off other paragraphs for context
- [ ] Refine GPT prompts for better summarization & query handling.
- [ ] Add export options (PDF, email, API integration).
- [ ] Conduct real-world tests in live meetings.
- [ ] Store meeting notes locally to maintain a history of discussions.

---

## Bugs
- [x] Meeting mode doubles the text
- [x] Control pannel should stay at the top when there is y-overflow
- [ ] Transcript paragraphs disapears while getting punctuated
