// Auth Toggle Support
const loginBtn = document.getElementById('login-btn');
const signupBtn = document.getElementById('signup-btn');
const toggleAuth = document.getElementById('toggle-auth');
const formTitle = document.getElementById('form-title');
const errorElement = document.getElementById('error');

let isSignup = false;

if (toggleAuth) {
  toggleAuth.addEventListener('click', () => {
    isSignup = !isSignup;
    formTitle.textContent = isSignup ? 'Signup' : 'Login';
    loginBtn.style.display = isSignup ? 'none' : 'inline-block';
    signupBtn.style.display = isSignup ? 'inline-block' : 'none';
    toggleAuth.textContent = isSignup ? 'Switch to Login' : 'Switch to Signup';
    document.getElementById('toggle-text').textContent = isSignup
      ? 'Already have an account?'
      : "Don't have an account?";
    errorElement.textContent = '';
  });
}

// Login Functionality
if (loginBtn) {
  loginBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    errorElement.textContent = '';

    if (!username || !password) {
      errorElement.textContent = 'Please enter both username and password';
      return;
    }

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
        credentials: 'include'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      if (data.success) {
        window.location.href = 'chat.html';
      } else {
        errorElement.textContent = data.error || 'Login failed';
      }
    } catch (err) {
      errorElement.textContent = err.message || 'Login failed. Please try again.';
      console.error('Login error:', err);
    }
  });
}

// Signup Functionality
if (signupBtn) {
  signupBtn.addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    errorElement.textContent = '';

    if (!username || !password) {
      errorElement.textContent = 'Please enter both username and password';
      return;
    }

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        errorElement.textContent = '✅ Signup successful! You can now login.';
        toggleAuth.click();
      } else {
        errorElement.textContent = data.error || 'Signup failed';
      }
    } catch (err) {
      errorElement.textContent = '❌ Network error during signup';
    }
  });
}

// Chat Page Functionality
if (document.getElementById('send-btn')) {
  document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('send-btn').click();
    }
  });

  document.getElementById('send-btn').addEventListener('click', sendMessage);

  document.getElementById('logout-btn').addEventListener('click', async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });

      if (response.ok) {
        window.location.href = 'index.html';
      } else {
        displayMessage('❌ Logout failed. Please try again.', 'bot error');
      }
    } catch (err) {
      displayMessage('❌ Network error during logout', 'bot error');
      console.error('Logout error:', err);
    }
  });

  const resetBtn = document.getElementById('reset-chat-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('chat-area').innerHTML = '';
      document.getElementById('products-display').innerHTML = '';
      displayMessage("Chat reset. How can I help you now?", 'bot');
    });
  }

  displayMessage("Hello! How can I help you today? Try 'search jean' or click products below.", 'bot');
}

// Shared Functions

function displayMessage(text, sender) {
  const chatArea = document.getElementById('chat-area');
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${sender}`;

  const timestamp = new Date().toLocaleTimeString();
  msgDiv.innerHTML = `<span>${text}</span><br><small>${timestamp}</small>`;

  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function displayProducts(products) {
  const container = document.getElementById('products-display');

  if (!products.length) {
    container.innerHTML = '<p>No products found. Try another search.</p>';
    return;
  }

  container.innerHTML = products.map(product => `
    <div class="product-preview">
      <h3>${product.name}</h3>
      <p>$${product.price.toFixed(2)}</p>
      ${product.description ? `<p>${product.description}</p>` : ''}
      <button class="buy-btn" 
              data-id="${product.id}" 
              data-name="${product.name}"
              data-price="${product.price}">
        Buy Now
      </button>
    </div>
  `).join('');

  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', handleBuyClick);
  });
}

async function handleBuyClick(event) {
  const btn = event.currentTarget;
  const productId = parseInt(btn.dataset.id);
  const productName = btn.dataset.name;

  if (!productId || isNaN(productId)) {
    displayMessage('❌ Invalid product selection', 'bot error');
    return;
  }

  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Processing...';

  displayMessage(`Buying ${productName}...`, 'user');

  try {
    const response = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Purchase failed');
    }

    if (data.success) {
      displayMessage(data.message, 'bot success');
    } else {
      displayMessage(`❌ ${data.error || 'Purchase failed'}`, 'bot error');
    }
  } catch (err) {
    displayMessage(`❌ ${err.message || 'Purchase failed. Please try again.'}`, 'bot error');
    console.error('Purchase error:', err);
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

async function sendMessage() {
  const inputElement = document.getElementById('message-input');
  const message = inputElement.value.trim();

  if (!message) return;

  displayMessage(message, 'user');
  inputElement.value = '';

  try {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ message })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to process message');
    }

    const data = await response.json();
    if (data.products) {
      displayProducts(data.products);
    } else if (data.reply) {
      displayMessage(data.reply, 'bot');
    }
  } catch (err) {
    displayMessage(`❌ ${err.message || 'Failed to send message'}`, 'bot error');
    console.error('Chat error:', err);
  }
}
