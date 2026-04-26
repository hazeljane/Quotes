let quotes = [];
let index = 0;

const API = "/api";

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

if (!userId) location.href = "login.html";

const userNameEl = document.getElementById("userName");
const quoteEl = document.getElementById("quote");

function init() {
  userNameEl.textContent = `Welcome ${username || "User"}`;
  loadQuotes().then(loadUser);
}

init();

async function loadQuotes() {
  const res = await fetch(`${API}/quotes`);
  quotes = await res.json();
  showQuote();
}

function showQuote() {
  const q = quotes[index];
  if (!q) return;
  quoteEl.textContent = q.text;
}

async function loadUser() {
  const res = await fetch(`${API}/user/${userId}`);
  const data = await res.json();
  userNameEl.textContent = `Welcome ${data.username}`;
}

/* NAV */
document.getElementById("next").onclick = () => {
  index = (index + 1) % quotes.length;
  showQuote();
};

document.getElementById("prev").onclick = () => {
  index = (index - 1 + quotes.length) % quotes.length;
  showQuote();
};

/* LIKE */
document.getElementById("likeBtn").onclick = async () => {
  const quoteId = quotes[index]._id;

  await fetch(`${API}/like/${userId}/${quoteId}`, {
    method: "POST"
  });
};

/* REVIEW */
document.getElementById("submitReview").onclick = async () => {
  const text = document.getElementById("reviewInput").value;

  const quoteId = quotes[index]._id;

  await fetch(`${API}/review/${userId}/${quoteId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ review: text })
  });
};