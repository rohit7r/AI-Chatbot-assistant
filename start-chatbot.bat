@echo off
cd /d "%~dp0"
echo Starting AI Chatbot server...
echo.
echo Keep this window open while using the chatbot.
echo Open http://localhost:3000 in your browser.
echo.
set "NODE_EXE=C:\Users\abc\AppData\Local\OpenAI\Codex\bin\node.exe"
if exist "%NODE_EXE%" (
  "%NODE_EXE%" server.js
) else (
  node server.js
)
echo.
echo Server stopped. Press any key to close this window.
pause >nul
