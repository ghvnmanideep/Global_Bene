const mongoose = require('mongoose');
const { getUserSegmentationData, updateAllUserSegmentation } = require('../utils/userSegmentation');
const User = require('../models/user');

// Only load Mixpanel if token is available
let setUserSegmentation = null;
if (process.env.MIXPANEL_TOKEN) {
  try {
    const { setUserSegmentation: mixpanelFunc } = require('../utils/mixpanelTracker');
    setUserSegmentation = mixpanelFunc;
  } catch (error) {
    console.log('⚠️  Mixpanel not available, running tests without Mixpanel integration');
  }
}

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globalbene');
    console.log('MongoDB connected for testing');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Test user segmentation for a specific user
const testUserSegmentation = async (userId) => {
  console.log(`\n=== Testing User Segmentation for User: ${userId} ===`);

  try {
    const segmentationData = await getUserSegmentationData(userId);

    if (!segmentationData) {
      console.log('❌ No segmentation data found for user');
      return;
    }

    console.log('✅ User segmentation data calculated:');
    console.log(JSON.stringify(segmentationData, null, 2));

    // Test Mixpanel integration (without actually sending to avoid API calls in test)
    console.log('\n📊 Mixpanel segmentation properties that would be set:');
    Object.entries(segmentationData).forEach(([key, value]) => {
      console.log(`  ${key}: ${JSON.stringify(value)}`);
    });

  } catch (error) {
    console.error('❌ Error testing user segmentation:', error);
  }
};

// Test updating all users
const testUpdateAllUsers = async () => {
  console.log('\n=== Testing Update All Users Segmentation ===');

  try {
    const result = await updateAllUserSegmentation();
    console.log('✅ Update result:', result);
  } catch (error) {
    console.error('❌ Error updating all users:', error);
  }
};

// Main test function
const runTests = async () => {
  await connectDB();

  // Get a test user
  const testUser = await User.findOne().select('_id username').limit(1);
  if (!testUser) {
    console.log('❌ No users found in database');
    process.exit(1);
  }

  console.log(`Found test user: ${testUser.username} (${testUser._id})`);

  // Run individual user test
  await testUserSegmentation(testUser._id);

  // Run bulk update test (commented out to avoid actual Mixpanel API calls)
  // await testUpdateAllUsers();

  console.log('\n🎉 User segmentation tests completed!');
  process.exit(0);
};

// Run tests if this script is executed directly
if (require.main === module) {
  runTests();
}

module.exports = { testUserSegmentation, testUpdateAllUsers };