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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ username, password })
    });

    if (response.redirected) {
      window.location.href = response.url;
      return;
    }

    const result = await response.json();

    if (response.ok) {
      messageEl.textContent = "Login successful! Redirecting...";
      messageEl.classList.add("success");
      setTimeout(() => {
        window.location.href = "/index.html";
      }, 1000);
    } else {
      messageEl.textContent = result.error || "Invalid credentials";
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

  const id = document.getElementById("complaintId")?.value;
  const title = document.getElementById("title").value;
  const description = document.getElementById("description").value;
  const department = document.getElementById("department").value;
  const priority = document.getElementById("priority").value;

  try {
    const res = await fetch(id ? `/complaints/${id}` : `/complaints`, {
      method: id ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json"
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
      alert(result.error || "Failed to submit complaint.");
    }
  } catch (err) {
    console.error("Error submitting complaint:", err);
    alert("Network error while submitting complaint.");
  }
});


// -------------------------
// LOGOUT HANDLER
// -------------------------
document.getElementById("logout-btn")?.addEventListener("click", async () => {
  try {
    const response = await fetch("/auth/logout", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      // Clear any local storage if needed
      localStorage.removeItem("user");
      // Redirect to login page
      window.location.href = "/login.html";
    } else {
      const result = await response.json();
      alert(result.error || "Logout failed. Please try again.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("An error occurred during logout. Please try again.");
  }
});



// -------------------------
// LOAD COMPLAINTS
// -------------------------
async function loadComplaints() {
  try {
    const res = await fetch("/complaints");
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
function editComplaint(id) {
  fetch("/complaints")
    .then(res => res.json())
    .then(data => {
      const complaint = data.find(c => c._id === id);
      if (!complaint) return alert("Complaint not found");

      document.getElementById("complaintId").value = complaint._id;
      document.getElementById("title").value = complaint.title;
      document.getElementById("description").value = complaint.description;
      document.getElementById("department").value = complaint.department;
      document.getElementById("priority").value = complaint.priority;
    });
}

// -------------------------
// DELETE COMPLAINT
// -------------------------
async function deleteComplaint(id) {
  if (!confirm("Are you sure you want to delete this complaint?")) return;

  try {
    const res = await fetch(`/complaints/${id}`, { method: "DELETE" });
    if (res.ok) {
      alert("Complaint deleted.");
      loadComplaints();
    } else {
      alert("Failed to delete complaint.");
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
