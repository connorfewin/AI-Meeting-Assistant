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
- [ ] Optimize for low latency and useful insights.

---

## **4. AI Query Feature (On-Demand Responses)**
- [ ] Implement a **secondary UI section** with a button to trigger AI queries.
- [ ] Once the button is pressed:
  - [ ] Capture the next spoken phrase.
  - [ ] Send it as a structured GPT request.
  - [ ] Display GPT’s response in a separate answer window.
- [ ] Allow stopping/resetting queries easily.

---

## **5. Speaker Identification** 
- [ ] Capture audio from meetings / videos (Screen share capture)
- [ ] Tag transcriptions with speaker labels.
- [ ] Ensure correct speaker attribution for both summarization and AI queries.

---

## **6. Final Optimizations & Enhancements**
- [ ] Improve processing speed and UI responsiveness.
- [ ] Refine GPT prompts for better summarization & query handling.
- [ ] Add export options (PDF, email, API integration).
- [ ] Conduct real-world tests in live meetings.
- [ ] Store meeting notes locally to maintain a history of discussions.
