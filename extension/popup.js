// Popup logic — handles login, logout, and server URL config

const form = document.getElementById('auth-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const serverInput = document.getElementById('server-url');
const errorMsg = document.getElementById('error-msg');
const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const userEmailEl = document.getElementById('user-email');

// Load saved state
chrome.storage.local.get(['token', 'email', 'serverUrl'], (data) => {
    if (data.serverUrl) {
        serverInput.value = data.serverUrl;
    }
    if (data.token && data.email) {
        showLoggedIn(data.email);
    }
});

function showLoggedIn(email) {
    document.body.classList.add('is-logged-in');
    userEmailEl.textContent = email;
}

function showLoggedOut() {
    document.body.classList.remove('is-logged-in');
    userEmailEl.textContent = '';
}

// Login
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorMsg.style.display = 'none';

    const serverUrl = serverInput.value.replace(/\/+$/, '');
    if (!serverUrl) {
        errorMsg.textContent = 'Please enter your backend URL';
        errorMsg.style.display = 'block';
        return;
    }

    loginBtn.textContent = 'Logging in...';
    loginBtn.disabled = true;

    try {
        const res = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: emailInput.value,
                password: passwordInput.value,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Login failed');
        }

        // Store token, email, and server URL
        chrome.storage.local.set({
            token: data.token,
            email: emailInput.value,
            serverUrl: serverUrl,
        });

        showLoggedIn(emailInput.value);
        passwordInput.value = '';
    } catch (err) {
        errorMsg.textContent = err.message;
        errorMsg.style.display = 'block';
    } finally {
        loginBtn.textContent = '🔑 Login';
        loginBtn.disabled = false;
    }
});

// Logout
logoutBtn.addEventListener('click', () => {
    chrome.storage.local.remove(['token', 'email'], () => {
        showLoggedOut();
    });
});
