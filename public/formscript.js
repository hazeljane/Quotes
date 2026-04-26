document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("profileForm");
  const profileInput = document.getElementById("profileInput");
  const profileIcon = document.getElementById("profileIcon");
  const btn = form.querySelector("button");

  let imageData = "";

  profileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      imageData = ev.target.result;

      profileIcon.innerHTML = `
        <img src="${imageData}" style="width:100%;height:100%;object-fit:cover;border-radius:50%">
      `;
    };

    reader.readAsDataURL(file);
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const email = document.getElementById("email").value.trim();

    if (!username || !email) {
      alert("Fill all fields");
      return;
    }

    btn.disabled = true;

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          email,
          image: imageData
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message);
        return;
      }

      alert("Registered!");

      form.reset();
      window.location.href = "login.html";

    } catch (err) {
      alert("Server error");
    } finally {
      btn.disabled = false;
    }
  });
});