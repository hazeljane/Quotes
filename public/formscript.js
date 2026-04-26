document.addEventListener("DOMContentLoaded", () => {

const form = document.getElementById("profileForm");
const profileInput = document.getElementById("profileInput");
const profileIcon = document.getElementById("profileIcon");

const btn = form.querySelector("button[type='submit']");

let imageData = "";

/* =========================
   IMAGE PREVIEW
========================= */
profileInput.addEventListener("change", function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    imageData = e.target.result;

    profileIcon.innerHTML = `
      <img src="${imageData}" 
        style="width:100%; height:100%; object-fit:cover; border-radius:50%;">
    `;
  };

  reader.readAsDataURL(file);
});

/* =========================
   REGISTER USER
========================= */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim().toLowerCase();

  if (!username || !email) {
    alert("Please fill all fields");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Registering...";

  try {
    const res = await fetch("/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username,
        email,
        image: imageData
      })
    });

    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      alert(data.message || "Registration failed");
      return;
    }

    alert("Registered successfully! Please login.");

    form.reset();
    profileIcon.innerHTML = `<span class="material-symbols-outlined">account_circle</span>`;
    imageData = "";

    window.location.href = "login.html";

  } catch (err) {
    console.error(err);
    alert("Server error. Please try again.");
  } finally {
    btn.disabled = false;
    btn.textContent = "Register";
  }
});

});