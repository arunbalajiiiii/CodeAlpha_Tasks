@echo off
echo.
echo ====================================
echo  ProjectFlow - Backend Server
echo ====================================
echo.
echo Starting FastAPI on http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
python -m uvicorn app.main:app --reload --port 8000
