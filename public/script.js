let quotes = [];
let index = 0;

const API = "/api"; // 👈 important for Vercel deployment

/* =========================
   SESSION
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

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");

const reviewInput = document.getElementById("reviewInput");
const submitReview = document.getElementById("submitReview");

const historyBtn = document.getElementById("historyBtn");
const modal = document.getElementById("modal");
const closeModal = document.getElementById("closeModal");
const historyList = document.getElementById("historyList");

const likeBtn = document.getElementById("likeBtn");
const dislikeBtn = document.getElementById("dislikeBtn");
const ratingBtns = document.querySelectorAll(".rating button");

const logoutBtn = document.getElementById("logoutBtn");

/* =========================
   INIT
========================= */
function init() {
  userNameEl.textContent = `Welcome ${username || "User"}`;
  loadQuotes();
}

init();

/* =========================
   LOAD QUOTES
========================= */
async function loadQuotes() {
  try {
    const res = await fetch(`${API}/quotes`);

    if (!res.ok) throw new Error("Failed to load quotes");

    quotes = await res.json();

    if (!quotes.length) {
      quoteEl.textContent = "No quotes found";
      return;
    }

    showQuote();

  } catch (err) {
    console.error(err);
    quoteEl.textContent = "Server error";
  }
}

/* =========================
   SHOW QUOTE
========================= */
function showQuote() {
  if (!quotes.length) return;

  quoteEl.textContent = quotes[index].text;

  likeBtn.classList.remove("active");
  dislikeBtn.classList.remove("active");
  ratingBtns.forEach(b => b.classList.remove("active"));
}

/* =========================
   NAVIGATION
========================= */
prevBtn.onclick = () => {
  if (!quotes.length) return;

  index = (index - 1 + quotes.length) % quotes.length;
  showQuote();
};

nextBtn.onclick = () => {
  if (!quotes.length) return;

  index = (index + 1) % quotes.length;
  showQuote();
};

/* =========================
   LIKE
========================= */
likeBtn.onclick = async () => {
  const quoteId = quotes[index]?._id;
  if (!quoteId) return;

  likeBtn.classList.toggle("active");

  await fetch(`${API}/like/${userId}/${quoteId}`, {
    method: "POST"
  });
};

/* =========================
   DISLIKE
========================= */
dislikeBtn.onclick = () => {
  dislikeBtn.classList.toggle("active");
};

/* =========================
   STAR RATING
========================= */
ratingBtns.forEach((star, i) => {
  star.onclick = async () => {
    const quoteId = quotes[index]?._id;
    if (!quoteId) return;

    ratingBtns.forEach(b => b.classList.remove("active"));

    for (let j = 0; j <= i; j++) {
      ratingBtns[j].classList.add("active");
    }

    await fetch(`${API}/star/${userId}/${quoteId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ star: i + 1 })
    });
  };
});

/* =========================
   REVIEW
========================= */
submitReview.onclick = async () => {
  const text = reviewInput.value.trim();
  if (!text) return alert("Write a review");

  const quoteId = quotes[index]?._id;
  if (!quoteId) return;

  const res = await fetch(
    `${API}/review/${userId}/${quoteId}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ review: text })
    }
  );

  const data = await res.json();

  if (!res.ok) {
    alert(data.message || "Error");
    return;
  }

  alert(data.message);

  reviewInput.value = "";
  loadUser();
};

/* =========================
   USER DATA REFRESH
========================= */
async function loadUser() {
  try {
    const res = await fetch(`${API}/user/${userId}`);

    if (!res.ok) return;

    const data = await res.json();

    userNameEl.textContent = `Welcome ${data.username || username}`;

  } catch (err) {
    console.log("User load failed");
  }
}

/* =========================
   HISTORY
========================= */
historyBtn.onclick = async () => {
  modal.style.display = "flex";

  const res = await fetch(`${API}/user/${userId}`);
  const user = await res.json();

  historyList.innerHTML = "";

  (user.reviewedQuotes || []).forEach(item => {
    const quote = quotes.find(q => q._id === item.quoteId);

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${quote ? quote.text : "Quote not found"}</strong><br>
      💬 ${item.review}
    `;

    historyList.appendChild(li);
  });
};

/* =========================
   CLOSE MODAL
========================= */
closeModal.onclick = () => modal.style.display = "none";

window.onclick = (e) => {
  if (e.target === modal) modal.style.display = "none";
};

/* =========================
   LOGOUT
========================= */
logoutBtn.onclick = () => {
  localStorage.removeItem("userId");
  localStorage.removeItem("username");
  window.location.href = "login.html";
};