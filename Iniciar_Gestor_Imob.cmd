@echo off
setlocal
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js 24 nao encontrado. Consulte o README.md.
  pause
  exit /b 1
)
echo Iniciando Gestor Imob no computador local...
echo Abra http://127.0.0.1:4173 no navegador.
echo Para encerrar, use Ctrl+C nesta janela.
node server/index.js
if errorlevel 1 pause
