const chatForm = document.getElementById("chatForm");
const messageInput = document.getElementById("messageInput");
const chatMessages = document.getElementById("chatMessages");
const clearChatButton = document.getElementById("clearChatButton");
const sendButton = document.getElementById("sendButton");
const notice = document.getElementById("notice");

const welcomeMessage = "Hello! I am your AI chatbot. Ask me anything.";
const storageKey = "ai-chatbot-messages";

loadChatHistory();

chatForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const userText = messageInput.value.trim();

  if (userText === "") {
    return;
  }

  addMessage(userText, "user");
  saveMessage(userText, "user");
  messageInput.value = "";
  setLoading(true);
  hideNotice();
  showTypingMessage();

  getBotReply(userText)
    .then(function (reply) {
      removeTypingMessage();
      addMessage(reply, "bot");
      saveMessage(reply, "bot");
    })
    .catch(function (error) {
      removeTypingMessage();
      showNotice(error.message || "Server is not connected. Start start-chatbot.bat, keep it open, then refresh this page.");
    })
    .finally(function () {
      setLoading(false);
      focusMessageInput();
    });
});

clearChatButton.addEventListener("click", function () {
  localStorage.removeItem(storageKey);
  resetChat();
  hideNotice();
  focusMessageInput();
});

async function getBotReply(userText) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: userText
    })
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Chat request failed. Check your API key and server.");
  }

  return data.reply;
}

function addMessage(text, sender, saveToStorage = false) {
  const message = document.createElement("article");
  message.className = `message ${sender}`;

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = sender === "user" ? "You" : "AI";

  const paragraph = document.createElement("p");
  paragraph.textContent = text;

  message.appendChild(avatar);
  message.appendChild(paragraph);
  chatMessages.appendChild(message);
  scrollToLatestMessage();

  if (saveToStorage) {
    saveMessage(text, sender);
  }
}

function showTypingMessage() {
  const typing = document.createElement("article");
  typing.className = "message bot typing";
  typing.id = "typingMessage";

  const avatar = document.createElement("div");
  avatar.className = "avatar";
  avatar.textContent = "AI";

  const paragraph = document.createElement("p");
  paragraph.textContent = "AI is typing...";

  typing.appendChild(avatar);
  typing.appendChild(paragraph);
  chatMessages.appendChild(typing);
  scrollToLatestMessage();
}

function removeTypingMessage() {
  const typing = document.getElementById("typingMessage");

  if (typing) {
    typing.remove();
  }
}

function scrollToLatestMessage() {
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function saveMessage(text, sender) {
  const messages = getStoredMessages();
  messages.push({ text, sender });
  localStorage.setItem(storageKey, JSON.stringify(messages));
}

function getStoredMessages() {
  const savedMessages = localStorage.getItem(storageKey);

  if (!savedMessages) {
    return [];
  }

  try {
    return JSON.parse(savedMessages);
  } catch {
    return [];
  }
}

function loadChatHistory() {
  const messages = getStoredMessages();

  if (messages.length === 0) {
    resetChat();
    return;
  }

  chatMessages.innerHTML = "";

  for (const message of messages) {
    addMessage(message.text, message.sender);
  }
}

function resetChat() {
  chatMessages.innerHTML = "";
  addMessage(welcomeMessage, "bot");
}

function setLoading(isLoading) {
  sendButton.disabled = isLoading;
  messageInput.disabled = isLoading;
  sendButton.textContent = isLoading ? "Sending" : "Send";
}

function showNotice(text) {
  notice.textContent = text;
  notice.hidden = false;
}

function hideNotice() {
  notice.textContent = "";
  notice.hidden = true;
}

function focusMessageInput() {
  messageInput.focus();
}
