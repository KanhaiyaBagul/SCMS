// =================================================================
// Client-Side Authentication Guard:
// This script provides an additional layer of protection on the client
// side. It runs immediately when a protected page is loaded.
//
// How it works:
// 1. It checks for the presence of the 'token' in sessionStorage.
// 2. If the token does not exist, it means the user is not logged in.
// 3. It immediately redirects the user to the login page (`/index.html`)
//    before any of the protected page's content can be rendered.
//
// This prevents any "flicker" of protected content and ensures that
// unauthenticated users cannot see any part of the protected pages.
// =================================================================
(function() {
  const token = sessionStorage.getItem('token');
  if (!token) {
    // No token found, redirect to login page.
    window.location.href = '/index.html';
  }
})();
