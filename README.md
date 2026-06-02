# Tablero de Fertilizantes

Aplicación web para seguimiento de precios de fertilizantes y granos con análisis por IA.

## Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + Tailwind CSS + Recharts
- **Backend:** FastAPI (Python 3.11+)
- **Base de datos:** PostgreSQL (dev: SQLite)
- **IA:** Anthropic API (`claude-sonnet-4-20250514`) con `web_search`
- **Deploy:** Frontend → Vercel | Backend → Railway/Render

## Estructura

```
fertilizantes-dashboard/
├── frontend/          # Next.js app
└── backend/           # FastAPI app
```

## Inicio rápido

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
cp .env.example .env         # completar variables
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

## Variables de entorno

Ver `backend/.env.example` y `frontend/.env.local.example`.
