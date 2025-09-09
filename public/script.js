// =================================================================
// JWT Token Management:
// - The JWT is stored in both sessionStorage and a cookie.
// - sessionStorage: Used by the client-side JavaScript to quickly
//   access the token for API requests without having to parse cookies.
// - cookie: Sent automatically by the browser on every request,
//   allowing the server-side static file middleware to verify
//   the user's session and protect pages from direct URL access.
// =================================================================

// -------------------------
// LOGIN HANDLER
// -------------------------
document.getElementById("loginForm")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const loginBtn = document.getElementById("loginBtn");
  const messageEl = document.getElementById("message");
  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value;

  loginBtn.disabled = true;
  messageEl.textContent = "";
  messageEl.className = "message";

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    const result = await response.json();

    if (response.ok) {
      // On successful login, store the token.
      sessionStorage.setItem('token', result.token);
      // Set a cookie that expires with the session for server-side checks.
      document.cookie = `token=${result.token}; path=/; SameSite=Strict`;

      messageEl.textContent = "Login successful! Redirecting...";
      messageEl.classList.add("success");
      setTimeout(() => {
        window.location.href = "/home.html";
      }, 1000);
    } else {
      messageEl.textContent = result.error || result.msg || "Invalid credentials";
      messageEl.classList.add("error");
      document.getElementById("password").value = "";
    }
  } catch (error) {
    console.error("Login error:", error);
    messageEl.textContent = "Network error. Please try again.";
    messageEl.classList.add("error");
  } finally {
    loginBtn.disabled = false;
    document.getElementById("username").focus();
  }
});


// -------------------------
// COMPLAINT SUBMISSION HANDLER
// -------------------------
document.getElementById("complaint-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const token = sessionStorage.getItem('token');
  if (!token) return alert("Authentication error. Please log in again.");

  const id = document.getElementById("complaintId")?.value;
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const department = document.getElementById("department").value;
  const priority = document.getElementById("priority").value;

  try {
    const res = await fetch(id ? `/complaints/${id}` : `/complaints`, {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        // Include the JWT in the Authorization header for protected routes.
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ title, description, department, priority })
    });

    const result = await res.json();

    if (res.ok) {
      alert(id ? "Complaint updated successfully!" : "Complaint submitted successfully!");
      document.getElementById("complaint-form").reset();
      document.getElementById("complaintId").value = "";
      loadComplaints();
    } else {
       alert(result.error || result.msg || "Failed to submit complaint.");
    }
  } catch (err) {
    console.error("Error submitting complaint:", err);
    alert("Network error while submitting complaint.");
  }
});


// -------------------------
// LOGOUT HANDLER
// -------------------------
document.getElementById("logout-btn")?.addEventListener("click", () => {
  // Clear the token from sessionStorage and the cookie.
  sessionStorage.removeItem('token');
  // Expire the cookie by setting its expiration date to the past.
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';

  // Redirect to the login page.
  window.location.href = "/index.html";
});


// -------------------------
// LOAD COMPLAINTS
// -------------------------
async function loadComplaints() {
  const token = sessionStorage.getItem('token');
  if (!token) {
    // If no token, redirect to login. This is a fallback.
    window.location.href = '/index.html';
    return;
  }

  try {
    const res = await fetch("/complaints", {
      headers: { "Authorization": `Bearer ${token}` }
    });

    if (res.status === 401) {
       // If token is invalid/expired, clear it and redirect.
       sessionStorage.removeItem('token');
       document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
       window.location.href = '/index.html';
       return;
    }

    const complaints = await res.json();
    const listContainer = document.getElementById("complaint-list");
    if (!listContainer) return;

    listContainer.innerHTML = ""; // Clear old

    complaints.forEach((c) => {
      const card = document.createElement("div");
      card.className = "complaint-card";
      card.innerHTML = `
        <h3>${c.title}</h3>
        <p class="meta">Dept: ${c.department} | Priority: ${c.priority}</p>
        <p>${c.description}</p>
        <div class="buttons">
          <button onclick="editComplaint('${c._id}')">✏️ Edit</button>
          <button class="delete-btn" onclick="deleteComplaint('${c._id}')">🗑️ Delete</button>
        </div>
      `;
      listContainer.appendChild(card);
    });
  } catch (err) {
    console.error("Failed to load complaints:", err);
  }
}

// -------------------------
// EDIT COMPLAINT
// -------------------------
async function editComplaint(id) {
  const token = sessionStorage.getItem('token');
  if (!token) return alert("Authentication error. Please log in again.");

  try {
    const res = await fetch(`/complaints`, {
      headers: { "Authorization": `Bearer ${token}` }
    });
    const complaints = await res.json();
    const complaint = complaints.find(c => c._id === id);
    if (!complaint) return alert("Complaint not found");

    document.getElementById("complaintId").value = complaint._id;
    document.getElementById("title").value = complaint.title;
    document.getElementById("description").value = complaint.description;
    document.getElementById("department").value = complaint.department;
    document.getElementById("priority").value = complaint.priority;

    window.scrollTo(0, 0); // Scroll to top to see the form
  } catch (err) {
    console.error("Error fetching complaint for edit:", err);
  }
}

// -------------------------
// DELETE COMPLAINT
// -------------------------
async function deleteComplaint(id) {
  const token = sessionStorage.getItem('token');
  if (!token) return alert("Authentication error. Please log in again.");

  if (!confirm("Are you sure you want to delete this complaint?")) return;

  try {
    const res = await fetch(`/complaints/${id}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${token}` }
    });

    const result = await res.json();
    if (res.ok) {
      alert("Complaint deleted.");
      loadComplaints();
    } else {
      alert(result.error || result.msg || "Failed to delete complaint.");
    }
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Network error");
  }
}

// Load complaints on page load
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("complaint-list")) {
    loadComplaints();
  }
});
