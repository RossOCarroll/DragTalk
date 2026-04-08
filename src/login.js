document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#loginForm');
  const errorMsg = document.querySelector('#errorMsg');

  form.addEventListener('submit', e => {
    e.preventDefault();

    const username = form.querySelector('#username').value.trim();
    const password = form.querySelector('#password').value.trim();

    // Hardcoded admin credentials
    const ADMIN_USER = 'admin';
    const ADMIN_PASS = 'password123';

    if (username === ADMIN_USER && password === ADMIN_PASS) {
      // Save login flag to sessionStorage
      sessionStorage.setItem('isAdmin', 'true');
      // Redirect to admin page
      window.location.href = 'admin.html';
    } else {
      errorMsg.textContent = 'Invalid username or password';
      errorMsg.style.display = 'block';
    }
  });
});