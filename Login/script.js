document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const togglePasswordBtn = document.getElementById('toggle-password');
  const alertBox = document.getElementById('alert-box');
  const emailError = document.getElementById('email-error');
  const passwordError = document.getElementById('password-error');
  const submitBtn = document.getElementById('submit-btn');

  // Toggle password visibility
  togglePasswordBtn.addEventListener('click', () => {
    const isPassword = passwordInput.getAttribute('type') === 'password';
    passwordInput.setAttribute('type', isPassword ? 'text' : 'password');
    togglePasswordBtn.textContent = isPassword ? '🙈' : '👁️';
  });

  // Clear errors on input
  emailInput.addEventListener('input', () => {
    emailError.textContent = '';
  });

  passwordInput.addEventListener('input', () => {
    passwordError.textContent = '';
  });

  // Form submit handler
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;
    const emailVal = emailInput.value.trim();
    const passwordVal = passwordInput.value.trim();

    if (!emailVal) {
      emailError.textContent = 'Please enter your email or username.';
      isValid = false;
    }

    if (!passwordVal) {
      passwordError.textContent = 'Please enter your password.';
      isValid = false;
    } else if (passwordVal.length < 6) {
      passwordError.textContent = 'Password must be at least 6 characters.';
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    // Simulate login request
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in...';
    showAlert('Signing in, please wait...', 'normal');

    setTimeout(() => {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign In';

      showAlert('Login successful! Redirecting...', 'success');
      console.log('Login attempt:', {
        usernameOrEmail: emailVal,
        remember: document.getElementById('remember-me').checked,
      });
    }, 1200);
  });

  function showAlert(message, type) {
    alertBox.textContent = message;
    alertBox.className = 'alert';
    if (type === 'success') {
      alertBox.classList.add('success');
    } else if (type === 'error') {
      alertBox.classList.add('error');
    }
  }
});
