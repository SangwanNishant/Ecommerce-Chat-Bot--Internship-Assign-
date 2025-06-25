require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
async function seedDB() {
  try {
    await Product.deleteMany({});
    await Product.insertMany(products);
    
    await User.deleteMany({});
    await User.create({ username: 'user1', password: 'pass1' });
    
    console.log('✅ Database seeded successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', err);
  } finally {
    mongoose.connection.close();
  }
}

seedDB();