require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/user');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();
    console.log('Connected to database');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create default admin user
    const adminData = {
      username: 'admin',
      email: 'admin@globalbene.com',
      passwordHash: 'AdminPass123!', // This will be hashed by pre-save hook
      role: 'admin',
      emailVerified: true,
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log('Username: admin');
    console.log('Email: admin@globalbene.com');
    console.log('Password: AdminPass123!');
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();