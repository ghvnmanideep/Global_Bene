const mongoose = require('mongoose');
require('dotenv').config();

async function dropPosts() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    await mongoose.connection.db.dropCollection('posts');
    console.log('✅ Dropped posts collection');
  } catch (error) {
    console.error('Error dropping posts collection:', error);
  } finally {
    await mongoose.disconnect();
  }
}

dropPosts();