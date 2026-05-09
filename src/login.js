import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://xnqvjcjmympojjtkhcmt.supabase.co',
  'sb_publishable_poUZopim6HVLH-BycJrXag_NfIEh4Ft'
);

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#loginForm');
  const errorMsg = document.querySelector('#errorMsg');

  form.addEventListener('submit', async e => {
    e.preventDefault();

    const email = form.querySelector('#username').value.trim();
    const password = form.querySelector('#password').value.trim();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      errorMsg.textContent = error.message;
      errorMsg.style.display = 'block';
    } else {
      window.location.href = `${BASE_PATH}admin.html`;
    }
  });
});