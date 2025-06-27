require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Database Connection with improved error handling
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce-chatbot', {
  serverSelectionTimeoutMS: 5000
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// Enhanced Product Model with validation
const productSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, 'Product ID is required'],
    unique: true,
    validate: {
      validator: Number.isInteger,
      message: 'Product ID must be an integer'
    }
  },
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true
  },
  price: {
    type: Number,
    required: [true, 'Product price is required'],
    min: [0, 'Price cannot be negative']
  },
  category: {
    type: String,
    required: [true, 'Product category is required']
  },
  description: String
});

const Product = mongoose.model('Product', productSchema);

// User Model
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  }
});

const User = mongoose.model('User', userSchema);

// Middleware
app.use(cors({
  credentials: true,
  origin: ['http://localhost:3000'],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.static('public'));

// ✨ Signup Route (New)
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Username and password are required' });

    const existingUser = await User.findOne({ username });
    if (existingUser)
      return res.status(409).json({ error: 'Username already exists' });

    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ success: true, message: 'Signup successful' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '1h' });
    
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 3600000 // 1 hour
    });
    
    res.json({ 
      success: true, 
      username: user.username 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Chat Route
app.post('/api/chat', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Invalid message format' });
    }

    if (/search|find/i.test(message)) {
      const searchTerm = message.replace(/search|find/gi, '').trim();
      if (!searchTerm) {
        return res.json({ reply: "Please specify what you're searching for" });
      }
      
      const products = await Product.find({ 
        name: { $regex: searchTerm, $options: 'i' } 
      }).limit(5);
      
      return res.json(products.length ? { products } : { reply: "No products found matching your search" });
    }
    
    res.json({ reply: "How can I help you today?" });
  } catch (err) {
    if (err.name === 'JsonWebTokenError') {
      return res.status(403).json({ error: 'Invalid token' });
    }
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Purchase Route
app.post('/api/purchase', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ error: 'Unauthorized' });

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
      if (err) return res.status(403).json({ error: 'Invalid token' });

      const productId = parseInt(req.body.productId);
      if (isNaN(productId)) {
        return res.status(400).json({ 
          success: false,
          error: 'Invalid product ID format' 
        });
      }

      const product = await Product.findOne({ id: productId });
      if (!product) {
        return res.status(404).json({ 
          success: false,
          error: 'Product not found in database' 
        });
      }

      res.json({ 
        success: true,
        message: `✅ Purchased: ${product.name}\n$${product.price.toFixed(2)}\nOrder ID: ${Date.now()}`,
        product: {
          id: product.id,
          name: product.name,
          price: product.price
        }
      });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logout Route (keep for now)
app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.status(200).json({ success: true, message: 'Logged out' });
});

// Error Handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Something went wrong' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📚 API Routes:
  - POST /api/auth/signup
  - POST /api/auth/login
  - POST /api/auth/logout
  - POST /api/chat
  - POST /api/purchase`);
});
