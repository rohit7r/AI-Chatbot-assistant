# AI Chatbot Project

This is a beginner-friendly AI chatbot project.

## Files

- `index.html` creates the chatbot page.
- `style.css` controls the design.
- `script.js` sends messages from the browser to the backend.
- `server.js` runs the backend server and connects to AI.
- `.env.example` shows where the API key will go.

## Run The Project

Open a terminal in this folder and run:

```powershell
node server.js
```

Then open:

```text
http://localhost:3000
```

If `npm` is installed on your computer, this also works:

```powershell
npm start
```

## Add Real AI

Create a file named `.env` in this folder:

```text
GEMINI_API_KEY=your_real_gemini_key_here
GEMINI_MODEL=gemini-2.5-flash-lite
```

Never share your `.env` file or API key.
