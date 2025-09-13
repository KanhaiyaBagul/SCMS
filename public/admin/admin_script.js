// -------------------------
// ADMIN LOGOUT HANDLER
// -------------------------
document.getElementById("admin-logout-btn")?.addEventListener("click", () => {
  // Clear the token from sessionStorage and the cookie.
  sessionStorage.removeItem('token');
  // Expire the cookie by setting its expiration date to the past.
  document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';

  // Redirect to the main login page.
  window.location.href = "/index.html";
});
