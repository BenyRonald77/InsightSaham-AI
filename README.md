# InsightSaham — AI Technical Analysis Generator 12

> Internal tool untuk mengotomatisasi pembuatan analisis teknikal saham IDX, meniru format kartu analisis "Trader Swing Saham Indonesia" dengan tambahan modul prediksi berbasis probabilitas historis.

## Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | Python + FastAPI |
| Frontend | Vite + Vanilla JS |
| Database | SQLite |
| Charts | Lightweight Charts (TradingView) |
| AI / LLM | Google Gemini API (Flash) |
| Data | yfinance (OHLCV harian) |

## Quick Start

### 1. Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux

pip install -r requirements.txt
cp ../.env.example ../.env   # Edit with your API keys
uvicorn main:app --reload
```

Backend API: http://localhost:8000
API Docs: http://localhost:8000/docs

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## Fitur Utama (Fase 1 MVP)

- ✅ Universe & Auto-Filter Saham (buang suspend & harga < Rp50)
- ✅ Pemilihan Saham Manual (Stock Picker)
- ✅ Data Sync Engine (yfinance)
- ✅ Indicator Calculation (EMA, BB, Stochastic, MACD, A/D)
- ✅ Support/Resistance & Bias Engine
- ✅ AI Narrative Engine (Google Gemini Flash)
- ✅ Analysis Card Generator
- ✅ Dashboard Web + Arsip Historis

## License

Internal use only.
