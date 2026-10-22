# Focus2Finish starter

A small React + Vite frontend and Django REST Framework backend for the first usable MVP:
- Create/list tasks
- Create/list learning resources
- Start and finish focus sessions
- Suggest the next unfinished task/resource
- PostgreSQL configuration via environment variables

## Prerequisites
- Python 3.11+ (use a currently supported version)
- Node.js LTS
- PostgreSQL installed and running
- Git (recommended)

## 1. PostgreSQL
Open pgAdmin or psql and create a database and user, for example:

```sql
CREATE USER focus_user WITH PASSWORD 'replace-with-a-strong-local-password';
CREATE DATABASE focus2finish OWNER focus_user;
```

Use your own local password. Do not commit secrets.

## 2. Backend (PowerShell)
Open a terminal in this folder:

```powershell
cd backend
py -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
Copy-Item .env.example .env
```

Edit `backend/.env` and set the PostgreSQL password. Then:

```powershell
python manage.py makemigrations core
python manage.py migrate
python manage.py runserver 
```

Backend: http://127.0.0.1:8000/api/

Health check: http://127.0.0.1:8000/api/health/

## 3. Frontend
Open a SECOND terminal at the project root:

```powershell
cd frontend
npm install
Copy-Item .env.example .env
npm run dev
```

Open the URL Vite prints, usually http://localhost:5173.

## 4. MVP test
1. Add a task from the dashboard.
2. Add a learning resource URL.
3. Click Start on a task to create a focus session.
4. Click Finish session to record it.
5. Use "Suggest next activity" to open the next available task/resource.

## Important
This is a local single-user prototype with open development API permissions. Do not expose it to the public internet or store sensitive data until authentication, per-user data isolation, HTTPS, and production settings are added.

The Android monitor is intentionally not included yet. First validate the workflow in the web MVP, then add a native Kotlin app that measures usage of user-selected apps using Android's supported usage-access APIs.
