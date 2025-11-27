require('dotenv').config();
const { sendMail } = require('../utils/email.util');

async function testSendGrid() {
  try {
    console.log('🧪 Testing SendGrid email functionality...');

    // Check if API key is configured
    if (!process.env.SENDGRID_API_KEY) {
      console.error('❌ SENDGRID_API_KEY not found in environment variables');
      console.log('📝 Please add your SendGrid API key to the .env file:');
      console.log('   SENDGRID_API_KEY=SG.your-actual-api-key-here');
      console.log('📖 See SENDGRID_SETUP.md for detailed instructions');
      return;
    }

    // Check if API key looks valid
    if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
      console.error('❌ SENDGRID_API_KEY does not appear to be a valid SendGrid API key');
      console.error('   SendGrid API keys should start with "SG."');
      console.log('📝 Please get a valid API key from https://app.sendgrid.com');
      console.log('📖 See SENDGRID_SETUP.md for setup instructions');
      return;
    }

    console.log('✅ SendGrid API key found and appears valid');

    // Test email
    const testEmail = process.env.ADMIN_EMAIL || 'test@example.com';
    const subject = 'SendGrid Test - Global Bene';
    const html = `
      <div style="background:#f8fafc;padding:24px;">
        <h2 style="color:#4f46e5;">SendGrid Test Email</h2>
        <p>This is a test email to verify SendGrid integration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</p>
        <div style="margin-top:32px;font-size:.95em;color:#888;">Global Bene Team</div>
      </div>
    `;

    console.log(`📧 Sending test email to: ${testEmail}`);
    await sendMail(testEmail, subject, html);

    console.log('✅ Test email sent successfully!');
    console.log('📬 Check your inbox for the test email.');

  } catch (error) {
    console.error('❌ SendGrid test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run test if this script is executed directly
if (require.main === module) {
  testSendGrid();
}

module.exports = { testSendGrid };