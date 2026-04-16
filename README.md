# 🦴 LumbarAI

An AI-powered **lumbar spine MRI grading system** that uses **Mamdani fuzzy logic inference** to automatically grade the severity of five lumbar conditions across five spinal levels — producing structured diagnostic outputs from MRI series and coordinate data.

---

## 🧠 What It Does

LumbarAI accepts MRI study data (series descriptions + annotated coordinates) for a patient and uses a fuzzy inference engine to grade **25 lumbar findings** (5 conditions × 5 levels) as `Normal/Mild`, `Moderate`, or `Severe`.

### Conditions Assessed

| Condition | Abbreviation |
|-----------|-------------|
| Spinal Canal Stenosis | SCS |
| Left Neural Foraminal Narrowing | L-NFN |
| Right Neural Foraminal Narrowing | R-NFN |
| Left Subarticular Stenosis | L-SAS |
| Right Subarticular Stenosis | R-SAS |

### Spinal Levels

`L1/L2` · `L2/L3` · `L3/L4` · `L4/L5` · `L5/S1`

---

## 🔬 How the Fuzzy Engine Works

The backend implements a **Mamdani fuzzy inference system** with three fuzzy input variables computed per condition/level target:

| Input Variable | Description |
|----------------|-------------|
| `evidence` | Direct coordinate density at the target level (clamped, normalized) |
| `context` | Neighborhood support from adjacent levels + family-level breadth |
| `coverage` | Modality weight score derived from MRI series descriptions (e.g. `sagittal t2/stir`, `axial t2`) |

These are fuzzified using **triangular** and **trapezoidal** membership functions into `low`, `medium`, and `high` sets. Thirteen rules fire against these inputs, mapping to output sets `normal_mild`, `moderate`, and `severe`. A **centroid defuzzification** step over 201 sample points produces a crisp score (0–100), which maps to a final grade:

| Score Range | Grade |
|-------------|-------|
| 0 – 39 | Normal/Mild |
| 40 – 64 | Moderate |
| 65 – 100 | Severe |

---

## 📁 Project Structure

```
lumbarAi/
├── backend/
│   └── app/
│       ├── main.py          # FastAPI app — /api/health and /api/grade endpoints
│       └── fuzzy_logic.py   # Mamdani fuzzy inference engine
├── dataset/                 # MRI study datasets
├── scripts/
│   └── dev.mjs              # Concurrent dev runner (frontend + backend)
├── src/                     # React 19 frontend
├── index.html               # Vite HTML entry point
├── vite.config.js
└── package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+
- **Python** 3.9+
- **pip**

### 1. Clone the Repository

```bash
git clone https://github.com/riddima15benjamin/lumbarAi.git
cd lumbarAi
```

### 2. Install Frontend Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
pip install fastapi uvicorn pydantic
# Or if a requirements file exists:
pip install -r backend/requirements.txt
```

### 4. Run the App

**Both frontend and backend together:**
```bash
npm run dev
```

**Separately:**
```bash
npm run dev:frontend   # Vite dev server → http://localhost:5173
npm run backend        # FastAPI server  → http://localhost:8000
```

---

## 🌐 API Reference

### `GET /api/health`

Returns server status.

**Response:**
```json
{ "status": "ok" }
```

---

### `POST /api/grade`

Accepts a patient MRI study payload and returns fuzzy-graded diagnostic results for all 25 lumbar findings.

**Request Body:**

```json
{
  "study_id": "patient_001",
  "series": [
    { "series_id": 1, "description": "Sagittal T2/STIR" },
    { "series_id": 2, "description": "Axial T2" }
  ],
  "coordinates": [
    {
      "series_id": 1,
      "instance_number": 10,
      "condition": "spinal_canal_stenosis",
      "level": "l4_l5",
      "x": 120.5,
      "y": 340.0
    }
  ]
}
```

**Response:**

```json
{
  "method": "mamdani-fuzzy-inference",
  "explanation": "The strongest fuzzy activations cluster around ...",
  "grades": {
    "spinal_canal_stenosis_l4_l5": "Moderate",
    "left_neural_foraminal_narrowing_l5_s1": "Normal/Mild"
  },
  "diagnostics": [
    {
      "key": "spinal_canal_stenosis_l4_l5",
      "condition": "spinal_canal_stenosis",
      "level": "l4_l5",
      "score": 53.71,
      "grade": "Moderate",
      "inputs": { "evidence": 0.5, "context": 0.312, "coverage": 1.0 },
      "activatedRules": [
        { "consequent": "moderate", "activation": 0.5 }
      ]
    }
  ]
}
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Lucide React |
| Backend | Python, FastAPI, Uvicorn, Pydantic v2 |
| AI Engine | Mamdani Fuzzy Inference (custom implementation) |
| Data Utilities | PapaParse (CSV), JSZip |
| Styling | CSS |

---

## 📦 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Runs frontend + backend concurrently |
| `npm run dev:frontend` | Vite dev server only |
| `npm run backend` | FastAPI/Uvicorn server only |
| `npm run build` | Production build of the frontend |
| `npm run preview` | Preview the production build |

---

## 🤝 Contributing

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "Add your feature"`
4. Push: `git push origin feature/your-feature`
5. Open a Pull Request

---

## 📄 License

Currently unlicensed. Contact [@riddima15benjamin](https://github.com/riddima15benjamin) for usage permissions.
