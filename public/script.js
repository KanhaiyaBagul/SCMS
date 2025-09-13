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
  const role = document.getElementById("role").value;

  loginBtn.disabled = true;
  messageEl.textContent = "";
  messageEl.className = "message";

  try {
    const response = await fetch("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password, role })
    });

    const result = await response.json();

    if (response.ok) {
      // On successful login, store the token.
      sessionStorage.setItem('token', result.token);
      // Set a cookie that expires with the session for server-side checks.
      document.cookie = `token=${result.token}; path=/; SameSite=Strict`;

      messageEl.textContent = "Login successful! Redirecting...";
      messageEl.classList.add("success");

      // Decode JWT to get user role for redirection
      const decodedToken = JSON.parse(atob(result.token.split('.')[1]));
      const userRole = decodedToken.user.role;

      setTimeout(() => {
        if (userRole === 'admin') {
          window.location.href = "/admin/dashboard.html";
        } else {
          window.location.href = "/home.html";
        }
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
      const title = id ? "Update Successful" : "Submission Successful";
      const message = id ? "Your complaint has been updated." : "Your complaint has been submitted successfully.";
      showInfoModal(title, message);
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
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${c.title}</td>
        <td>${c.description}</td>
        <td>${c.department}</td>
        <td><span class="badge badge-${c.priority.toLowerCase()}">${c.priority}</span></td>
        <td class="actions">
          <button onclick="editComplaint('${c._id}')"><i class="fas fa-pencil-alt"></i> Edit</button>
          <button class="delete-btn" onclick="deleteComplaint('${c._id}')"><i class="fas fa-trash-alt"></i> Delete</button>
        </td>
      `;
      listContainer.appendChild(row);
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
// INFO MODAL
// -------------------------
function showInfoModal(title, message) {
  const modal = document.getElementById('info-modal');
  const modalTitle = document.getElementById('info-modal-title');
  const modalMessage = document.getElementById('info-modal-message');
  const okBtn = document.getElementById('info-modal-ok-btn');
  const closeModal = modal.querySelector('.close-button');

  modalTitle.textContent = title;
  modalMessage.textContent = message;

  const hide = () => modal.style.display = 'none';

  okBtn.onclick = hide;
  closeModal.onclick = hide;
  window.onclick = (event) => {
    if (event.target === modal) {
      hide();
    }
  };

  modal.style.display = 'block';
}

// -------------------------
// DELETE COMPLAINT
// -------------------------
async function deleteComplaint(id) {
  const modal = document.getElementById('confirmation-modal');
  const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
  const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
  const closeModal = modal.querySelector('.close-button');

  // Show the modal
  modal.style.display = 'block';

  // Clone the button to remove any old event listeners
  const newConfirmDeleteBtn = confirmDeleteBtn.cloneNode(true);
  confirmDeleteBtn.parentNode.replaceChild(newConfirmDeleteBtn, confirmDeleteBtn);

  // Create a function to hide the modal and clean up listeners
  const hideModal = () => {
    modal.style.display = 'none';
    // The cloned button and its listener will be garbage collected
  };

  // Attach event listener for the confirmation action
  newConfirmDeleteBtn.onclick = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      alert("Authentication error. Please log in again.");
      hideModal();
      return;
    }

    try {
      const res = await fetch(`/complaints/${id}`, { // Use the 'id' from the closure
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      const result = await res.json();
      if (res.ok) {
        showInfoModal("Deletion Successful", "The complaint has been deleted.");
        loadComplaints();
        loadDashboardStats();
      } else {
        alert(result.error || "Failed to delete complaint.");
      }
    } catch (err) {
      console.error("Delete failed:", err);
      alert("An error occurred during deletion.");
    } finally {
      hideModal();
    }
  };

  // Attach listeners to close the modal
  cancelDeleteBtn.onclick = hideModal;
  closeModal.onclick = hideModal;
  window.onclick = (event) => {
    if (event.target === modal) {
      hideModal();
    }
  };
}


async function loadDashboardStats() {
    const token = sessionStorage.getItem('token');
    if (!token) return;

    try {
        const res = await fetch("/complaints", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        const complaints = await res.json();

        const totalComplaints = complaints.length;
        const highPriorityComplaints = complaints.filter(c => c.priority === 'High').length;
        const mediumPriorityComplaints = complaints.filter(c => c.priority === 'Medium').length;
        const lowPriorityComplaints = complaints.filter(c => c.priority === 'Low').length;

        document.getElementById('total-complaints').textContent = totalComplaints;
        document.getElementById('high-priority-complaints').textContent = highPriorityComplaints;
        document.getElementById('medium-priority-complaints').textContent = mediumPriorityComplaints;
        document.getElementById('low-priority-complaints').textContent = lowPriorityComplaints;

    } catch (err) {
        console.error("Failed to load dashboard stats:", err);
        // handle error in UI
    }
}

// Load complaints on page load
window.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("complaint-list")) {
    loadComplaints();
    loadDashboardStats();
  }
});
