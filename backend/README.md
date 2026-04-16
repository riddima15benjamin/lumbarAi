# Lumbar AI Backend

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r backend/requirements.txt
uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

The frontend expects the API at `http://127.0.0.1:8000` in production, and uses the Vite dev proxy during local frontend development.
