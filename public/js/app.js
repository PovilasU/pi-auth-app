const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");
const profileInfo = document.getElementById("profileInfo");
const profileSection = document.getElementById("profileSection");
const logoutBtn = document.getElementById("logoutBtn");
const forms = document.getElementById("forms");

async function fetchProfile() {
  const res = await fetch("/profile");
  if (res.ok) {
    const text = await res.text();
    profileInfo.textContent = text;
    profileSection.style.display = "block";
    forms.style.display = "none";
  }
}

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("registerUsername").value;
  const password = document.getElementById("registerPassword").value;

  const res = await fetch("/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const text = await res.text();
  message.textContent = text;
});

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const username = document.getElementById("loginUsername").value;
  const password = document.getElementById("loginPassword").value;

  const res = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });

  const text = await res.text();
  message.textContent = text;

  if (res.ok) {
    fetchProfile();
  }
});

logoutBtn.addEventListener("click", async () => {
  const res = await fetch("/logout", { method: "POST" });
  const text = await res.text();
  message.textContent = text;
  profileSection.style.display = "none";
  forms.style.display = "block";
});
