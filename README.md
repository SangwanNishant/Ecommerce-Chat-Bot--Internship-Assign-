# 🛍️ E-commerce Sales Chatbot

A chatbot-based e-commerce web application that allows users to interact, search, and purchase products via a simple AI-powered chat interface.

---

## 🔧 Tech Stack

- **Frontend**: HTML, CSS, JavaScript 
- **Backend**: Node.js + Express
- **Database**: MongoDB + Mongoose
- **Authentication**: JWT (stored in HttpOnly Cookies)

---

## ✨ Features

- ✅ Signup and Login system
- 🧠 AI Chatbot to search products
- 🛒 Product browsing and purchase
- 📦 MongoDB inventory with 100+ products
- 🧾 Chat with timestamps
- 🔐 Secure user sessions using JWT
- 📱 Responsive design (Mobile/Desktop)
- 🔁 Chat reset + product result display

---

## 📁 Project Structure

ecommerce-chatbot/
│
├── public/
│ ├── index.html # Login + Signup
│ ├── chat.html # Chatbot UI
│ ├── style.css # Styling
│ └── script.js # Frontend logic
│
├── server.js # Backend server (Express)
├── .env # Environment variables
├── package.json
└── README.md
---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/your-username/ecommerce-chatbot.git
cd ecommerce-chatbot
npm install

API Endpoints

| Method | Route              | Description                    |
| ------ | ------------------ | ------------------------------ |
| POST   | `/api/auth/signup` | Register new user              |
| POST   | `/api/auth/login`  | Login and get session token    |
| POST   | `/api/auth/logout` | Logout and clear token cookie  |
| POST   | `/api/chat`        | Chat message -> product search |
| POST   | `/api/purchase`    | Purchase a product             |
