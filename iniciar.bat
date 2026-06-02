@echo off
echo Iniciando Tablero de Fertilizantes...

:: Backend
start "Backend" cmd /k "cd /d C:\fertilizantes-dashboard\backend && venv\Scripts\activate && uvicorn app.main:app"

:: Esperar 3 segundos a que el backend arranque
timeout /t 3 /nobreak > nul

:: Frontend
start "Frontend" cmd /k "cd /d C:\fertilizantes-dashboard\frontend && npm run dev"

:: Esperar 5 segundos y abrir el navegador
timeout /t 5 /nobreak > nul
start http://localhost:3000

echo Listo. Podés cerrar esta ventana.
