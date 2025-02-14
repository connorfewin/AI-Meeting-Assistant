Instructions for python servers:

cd C:\Users\cjfew\Desktop\Code\AI-Meeting-Assistant\Server

python -m venv venv

.\venv\Scripts\activate

pip install fastapi uvicorn transformers torch

uvicorn punctuator:app --host 0.0.0.0 --port 8001
