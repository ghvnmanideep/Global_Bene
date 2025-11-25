const { testAutoTagAPI } = require('../utils/autoTagging');

const testAPI = async () => {
  console.log('Testing Auto-Tag API Integration...\n');

  const result = await testAutoTagAPI();

  if (result.success) {
    console.log('✅ API Integration Successful!');
    console.log('Sample tags generated:', result.tags);
  } else {
    console.log('❌ API Integration Failed!');
    console.log('Error:', result.error);
    console.log('Make sure AUTOTAG_API_URL is set correctly in your .env file');
  }

  process.exit(result.success ? 0 : 1);
};

testAPI();