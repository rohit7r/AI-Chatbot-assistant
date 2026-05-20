const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = __dirname;

loadEnvFile();

process.on("uncaughtException", function (error) {
  console.error("Uncaught exception:", error);
});

process.on("unhandledRejection", function (reason) {
  console.error("Unhandled rejection:", reason);
});

const mimeTypes = {
  ".html": "text/html",
  ".css": "text/css",
  ".js": "text/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

const server = http.createServer(async function (request, response) {
  if (request.method === "GET" && request.url === "/api/status") {
    sendJson(response, 200, {
      server: "running",
      apiKeyConfigured: Boolean(isApiKeyConfigured()),
      provider: "gemini",
      model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite"
    });
    return;
  }

  if (request.method === "POST" && request.url === "/api/chat") {
    await handleChatRequest(request, response);
    return;
  }

  if (request.method === "GET") {
    serveStaticFile(request, response);
    return;
  }

  sendJson(response, 405, { error: "Method not allowed" });
});

server.listen(PORT, function () {
  console.log(`Chatbot server running at http://localhost:${PORT}`);
});

async function handleChatRequest(request, response) {
  try {
    const body = await readRequestBody(request);
    const data = JSON.parse(body || "{}");
    const message = String(data.message || "").trim();

    if (!message) {
      sendJson(response, 400, { error: "Message is required" });
      return;
    }

    const reply = isApiKeyConfigured()
      ? await getAiReply(message)
      : getDemoReply(message);

    sendJson(response, 200, { reply });
  } catch (error) {
    console.error(error);
    sendJson(response, 200, {
      reply: createFriendlyErrorReply(error)
    });
  }
}

async function getAiReply(message) {
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash-lite";
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const apiResponse = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY
    },
    body: JSON.stringify({
      system_instruction: {
        parts: [
          {
            text: "You are a helpful AI chatbot for a beginner student project. Answer clearly, simply, and politely."
          }
        ]
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: message
            }
          ]
        }
      ]
    })
  });

  const data = await apiResponse.json();

  if (!apiResponse.ok) {
    const apiError = data.error?.message || "Gemini API request failed";
    throw new Error(apiError);
  }

  return extractResponseText(data);
}

function extractResponseText(data) {
  const parts = data.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map(function (part) {
      return part.text || "";
    })
    .join("\n")
    .trim();

  return text || "I could not create a reply.";
}

function getDemoReply(message) {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return "Hello! The backend is working. Add your Gemini API key to make me a real AI chatbot.";
  }

  if (lowerMessage.includes("project")) {
    return "This is your chatbot project. It now has a frontend and a backend server.";
  }

  return "Backend reply received. Next, add a Gemini API key to turn this into a real AI chatbot.";
}

function createFriendlyErrorReply(error) {
  const message = String(error.message || "");

  if (message.toLowerCase().includes("quota")) {
    return "Your Gemini API key is connected, but the project has reached its free quota or rate limit. Wait for the quota reset or check Google AI Studio rate limits.";
  }

  if (message.toLowerCase().includes("api key not valid") || message.toLowerCase().includes("invalid api key")) {
    return "The Gemini API key was found, but Google says it is invalid. Please check GEMINI_API_KEY in your .env file.";
  }

  if (message.toLowerCase().includes("fetch failed")) {
    return "The Gemini API key was found, but the server could not reach Google Gemini. Please check your internet connection or firewall.";
  }

  return "The AI API returned an error: " + message;
}

function isApiKeyConfigured() {
  const apiKey = process.env.GEMINI_API_KEY || "";

  return (
    apiKey &&
    apiKey !== "your_gemini_key_here" &&
    apiKey !== "paste_your_gemini_key_here"
  );
}

function serveStaticFile(request, response) {
  const safeUrl = request.url === "/" ? "/index.html" : request.url;
  const filePath = path.join(PUBLIC_DIR, decodeURIComponent(safeUrl));

  if (!filePath.startsWith(PUBLIC_DIR)) {
    response.writeHead(403);
    response.end("Forbidden");
    return;
  }

  fs.readFile(filePath, function (error, content) {
    if (error) {
      response.writeHead(404);
      response.end("File not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    response.writeHead(200, {
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
    response.end(content);
  });
}

function readRequestBody(request) {
  return new Promise(function (resolve, reject) {
    let body = "";

    request.on("data", function (chunk) {
      body += chunk.toString();

      if (body.length > 10000) {
        request.destroy();
        reject(new Error("Request body is too large"));
      }
    });

    request.on("end", function () {
      resolve(body);
    });

    request.on("error", reject);
  });
}

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, { "Content-Type": "application/json" });
  response.end(JSON.stringify(data));
}

function loadEnvFile() {
  const envPath = path.join(__dirname, ".env");

  if (!fs.existsSync(envPath)) {
    return;
  }

  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}
