let quotes = [];
let index = 0;

/* =========================
   API CONFIG
========================= */
const API = "/api";

/* =========================
   AUTH
========================= */
const userId = localStorage.getItem("userId");
const username = localStorage.getItem("username");

if (!userId) {
  window.location.href = "login.html";
}

/* =========================
   ELEMENTS
========================= */
const userNameEl = document.getElementById("userName");
const quoteEl = document.getElementById("quote");

const nextBtn = document.getElementById("next");
const prevBtn = document.getElementById("prev");
const likeBtn = document.getElementById("likeBtn");
const reviewInput = document.getElementById("reviewInput");
const submitReview = document.getElementById("submitReview");

/* =========================
   INIT
========================= */
async function init() {
  try {
    userNameEl.textContent = `Welcome ${username || "User"}`;

    await loadQuotes();
    await loadUser();

  } catch (err) {
    console.error("INIT ERROR:", err);
  }
}

init();

/* =========================
   FETCH HELPER (IMPORTANT)
========================= */
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

/* =========================
   LOAD QUOTES
========================= */
async function loadQuotes() {
  try {
    const data = await fetchJSON(`${API}/quotes`);

    quotes = data;

    if (!quotes.length) {
      quoteEl.textContent = "No quotes found";
      return;
    }

    showQuote();

  } catch (err) {
    console.error("LOAD QUOTES ERROR:", err);
    quoteEl.textContent = err.message || "Failed to load quotes";
  }
}

/* =========================
   SHOW QUOTE
========================= */
function showQuote() {
  const q = quotes[index];
  if (!q) return;

  quoteEl.textContent = q.text;
}

/* =========================
   LOAD USER
========================= */
async function loadUser() {
  try {
    const data = await fetchJSON(`${API}/user/${userId}`);

    userNameEl.textContent = `Welcome ${data.username || username}`;

  } catch (err) {
    console.error("LOAD USER ERROR:", err);

    // auto logout if user invalid
    localStorage.clear();
    window.location.href = "login.html";
  }
}

/* =========================
   NAVIGATION
========================= */
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

/* =========================
   LIKE
========================= */
likeBtn?.addEventListener("click", async () => {
  try {
    const quoteId = quotes[index]?._id;
    if (!quoteId) return;

    await fetchJSON(`${API}/like/${userId}/${quoteId}`, {
      method: "POST",
    });

  } catch (err) {
    console.error("LIKE ERROR:", err);
    alert(err.message);
  }
});

/* =========================
   REVIEW
========================= */
submitReview?.addEventListener("click", async () => {
  try {
    const text = reviewInput.value.trim();
    if (!text) return alert("Write a review first");

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