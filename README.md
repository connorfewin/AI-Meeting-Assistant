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

## **5. Note Taking**
- [ ] Use previous paragraph to reduce redundancy in notes
- [ ] Add ability to combine paragraphs
- [ ] Optimize GPT prompts to get better notes.


---

## **6. Speaker Identification** 
- [x] Capture audio from meetings / videos (Screen share capture)
- [ ] Tag transcriptions with speaker labels.
- [ ] Ensure correct speaker attribution for both summarization and AI queries.

---

## **7. Final Optimizations & Enhancements**
- [ ] Improve processing speed and UI responsiveness.
- [x] Production version
- [ ] Have brain build off other paragraphs for context
- [ ] Refine GPT prompts for better summarization & query handling.
- [ ] Add export options (PDF, email, API integration).
- [ ] Conduct real-world tests in live meetings.
- [ ] Store meeting notes locally to maintain a history of discussions.

---

## Bugs
- [x] Meeting mode doubles the text
- [x] Control pannel should stay at the top when there is y-overflow
