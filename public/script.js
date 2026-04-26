let quotes = [];
let index = 0;

const API = "/api";

const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

if (!userId) {
  window.location.href = "login.html";
}

const userNameEl = document.getElementById("userName");
const quoteEl = document.getElementById("quote");

const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const likeBtn = document.getElementById("likeBtn");
const reviewInput = document.getElementById("reviewInput");
const submitReview = document.getElementById("submitReview");

async function init() {
  try {
    userNameEl.textContent = `Welcome ${username || "User"}`;

    await loadQuotes();
    await loadUser();

  } catch (err) {
    console.error("INIT ERROR:", err);
    alert("Failed to initialize app");
  }
}

init();

async function fetchJSON(url, options = {}) {
  const res = await fetch(url, options);

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("Invalid server response");
  }

  if (!res.ok) {
    throw new Error(data?.message || `HTTP ${res.status}`);
  }

  return data;
}

async function loadQuotes() {
  try {
    const data = await fetchJSON(`${API}/quotes`);

    quotes = data;

    if (!quotes.length) {
      quoteEl.textContent = "No quotes found";
      return;
    }

    index = 0;
    showQuote();

  } catch (err) {
    console.error("LOAD QUOTES ERROR:", err);
    quoteEl.textContent = err.message || "Failed to load quotes";
  }
}

function showQuote() {
  const q = quotes[index];
  if (!q) return;

  quoteEl.textContent = q.text;
}

async function loadUser() {
  try {
    const data = await fetchJSON(`${API}/user/${userId}`);

    userNameEl.textContent = `Welcome ${data.username || username}`;

  } catch (err) {
    console.error("LOAD USER ERROR:", err);

    localStorage.clear();
    window.location.href = "login.html";
  }
}

nextBtn?.addEventListener("click", () => {
  if (!quotes.length) return;

  index = (index + 1) % quotes.length;
  showQuote();
});

prevBtn?.addEventListener("click", () => {
  if (!quotes.length) return;

  index = (index - 1 + quotes.length) % quotes.length;
  showQuote();
});

likeBtn?.addEventListener("click", async () => {
  try {
    const quoteId = quotes[index]?._id;
    if (!quoteId) return;

    await fetchJSON(`${API}/like/${userId}/${quoteId}`, {
      method: "POST",
    });

    alert("Liked!");

  } catch (err) {
    console.error("LIKE ERROR:", err);
    alert(err.message);
  }
});

submitReview?.addEventListener("click", async () => {
  try {
    const text = reviewInput.value.trim();
    if (!text) {
      alert("Write a review first");
      return;
    }

    const quoteId = quotes[index]?._id;
    if (!quoteId) return;

    await fetchJSON(`${API}/review/${userId}/${quoteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: text }),
    });

    alert("Review saved!");
    reviewInput.value = "";

  } catch (err) {
    console.error("REVIEW ERROR:", err);
    alert(err.message);
  }
});