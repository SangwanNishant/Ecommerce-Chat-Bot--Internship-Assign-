// Login Functionality
if (document.getElementById('login-btn')) {
  document.getElementById('login-btn').addEventListener('click', async () => {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const errorElement = document.getElementById('error');

    // Clear previous errors
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

// Chat Page Functionality
if (document.getElementById('send-btn')) {
  // Enter key support
  document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('send-btn').click();
    }
  });

  // Send message
  document.getElementById('send-btn').addEventListener('click', sendMessage);

  // Logout functionality
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

  // Initial bot message
  displayMessage("Hello! How can I help you today? Try 'search jeans' or click products below.", 'bot');
}

// Shared Functions

/**
 * Displays a message in the chat area
 * @param {string} text - The message text
 * @param {string} sender - 'user' or 'bot' or 'bot success' or 'bot error'
 */
function displayMessage(text, sender) {
  const chatArea = document.getElementById('chat-area');
  const msgDiv = document.createElement('div');
  msgDiv.className = `msg ${sender}`;
  msgDiv.textContent = text;
  chatArea.appendChild(msgDiv);
  chatArea.scrollTop = chatArea.scrollHeight;
}

/**
 * Displays products in the products display area
 * @param {Array} products - Array of product objects
 */
function displayProducts(products) {
  const container = document.getElementById('products-display');
  container.innerHTML = products.map(product => `
    <div class="product">
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

  // Add event listeners to all buy buttons
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', handleBuyClick);
  });
}

/**
 * Handles the buy button click event
 * @param {Event} event - The click event
 */
async function handleBuyClick(event) {
  const btn = event.currentTarget;
  const productId = parseInt(btn.dataset.id);
  const productName = btn.dataset.name;

  // Validate product ID
  if (!productId || isNaN(parseInt(productId))) {
    displayMessage('❌ Invalid product selection', 'bot error');
    return;
  }

  // Disable button during processing
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = 'Processing...';

  // Show purchase attempt in chat
  displayMessage(`Buying ${productName}...`, 'user');

  try {
    const response = await fetch('/api/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ productId: parseInt(productId) }) // Ensure proper type
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
    // Re-enable button
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

/**
 * Sends a chat message to the server
 */
async function sendMessage() {
  const inputElement = document.getElementById('message-input');
  const message = inputElement.value.trim();

  if (!message) return;

  // Display user message
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