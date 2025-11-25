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

    // Create default admin user from environment variables
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@globalbene.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'AdminPass123!';

    const adminData = {
      username: adminUsername,
      email: adminEmail,
      passwordHash: adminPassword, // This will be hashed by pre-save hook
      role: 'admin',
      emailVerified: true,
    };

    const admin = new User(adminData);
    await admin.save();

    console.log('✅ Admin user created successfully!');
    console.log(`Username: ${adminUsername}`);
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('⚠️  IMPORTANT: Change the default password after first login!');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();