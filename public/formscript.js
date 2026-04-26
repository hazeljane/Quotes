document.addEventListener("DOMContentLoaded", () => {

  const form = document.getElementById("profileForm");
  const profileInput = document.getElementById("profileInput");
  const profileIcon = document.getElementById("profileIcon");
  const btn = form.querySelector("button");

  let imageData = "";

  /* =========================
     IMAGE PREVIEW
  ========================= */
  profileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (ev) => {
      imageData = ev.target.result;

      profileIcon.innerHTML = `
        <img src="${imageData}" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">
      `;
    };

    reader.readAsDataURL(file);
  });

  /* =========================
     API BASE (FIXED)
  ========================= */
  const API =
    window.location.hostname === "localhost"
      ? "http://localhost:5000"
      : "https://your-vercel-backend.vercel.app";

  /* =========================
     REGISTER
  ========================= */
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!username || !email) {
      alert("Please fill all fields");
      return;
    }

    btn.disabled = true;
    btn.textContent = "Registering...";

    try {
      const res = await fetch(`${API}/register`, {
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

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

      // SAVE SESSION
      localStorage.setItem("userId", data.user._id);
      localStorage.setItem("username", data.user.username);

      alert("Registration successful!");

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