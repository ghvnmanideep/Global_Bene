# SendGrid Email Setup Guide

## Overview
This guide provides step-by-step instructions to implement SendGrid for fast, reliable email delivery in your Global Bene application.

## Prerequisites
- SendGrid account (free tier available)
- Node.js application with `@sendgrid/mail` package installed
- Environment variables configured

## Step 1: SendGrid Account Setup

### 1.1 Create SendGrid Account
1. Go to [SendGrid](https://sendgrid.com)
2. Sign up for a free account
3. Verify your email address

### 1.2 Generate API Key
1. Login to your SendGrid dashboard
2. Go to **Settings** → **API Keys**
3. Click **Create API Key**
4. Choose **Full Access** or **Restricted Access** (recommended for production)
5. Copy the generated API key (save it securely)

### 1.3 Verify Single Sender
1. Go to **Settings** → **Sender Authentication**
2. Click **Verify a Single Sender**
3. Fill in your details:
   - **From Email**: `noreply@yourdomain.com` (or use SendGrid's domain)
   - **From Name**: `Global Bene`
   - **Reply To**: Your support email
4. Verify the email address

## Step 2: Environment Configuration

### 2.1 Update .env file
```bash
# Add your SendGrid API key
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here

# Optional: Override default sender
EMAIL_FROM="Global Bene <noreply@yourdomain.com>"
```

### 2.2 Environment Variables Reference
- `SENDGRID_API_KEY`: Your SendGrid API key (required)
- `EMAIL_FROM`: Default sender email address (optional)

## Step 3: Code Implementation

### 3.1 Email Utility (`utils/email.util.js`)
The email utility is already configured with SendGrid:

```javascript
const sgMail = require('@sendgrid/mail');

// Set SendGrid API key
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendMail = async (to, subject, html, from = null) => {
  const msg = {
    to,
    from: from || process.env.EMAIL_FROM || 'noreply@globalbene.com',
    subject,
    html,
  };

  await sgMail.send(msg);
};
```

### 3.2 Usage Examples

#### Basic Email
```javascript
const { sendMail } = require('./utils/email.util');

await sendMail(
  'user@example.com',
  'Welcome to Global Bene!',
  '<h1>Welcome!</h1><p>Thank you for joining.</p>'
);
```

#### HTML Email with Template
```javascript
const welcomeHtml = `
  <div style="background:#f8fafc;padding:24px;">
    <h2 style="color:#4f46e5;">Welcome to Global Bene!</h2>
    <p>Your account has been created successfully.</p>
  </div>
`;

await sendMail(user.email, 'Welcome!', welcomeHtml);
```

## Step 4: Email Templates

### 4.1 Available Templates
The application includes pre-built email templates:

1. **Welcome Email** - Sent after registration
2. **Login Notification** - Sent after successful login
3. **Password Reset** - Sent when user requests password reset
4. **Spam Notification** - Sent when post is flagged as spam
5. **Account Ban** - Sent when account is banned

### 4.2 Template Structure
All templates use responsive HTML with:
- Dark theme styling
- Mobile-friendly design
- Consistent branding
- Call-to-action buttons

## Step 5: Testing

### 5.1 Test Script
Run the included test script to verify SendGrid integration:

```bash
cd backend
node scripts/testSendGrid.js
```

### 5.2 Manual Testing
1. Register a new user
2. Check email for welcome message
3. Login to trigger login notification
4. Request password reset

## Step 6: Production Deployment

### 6.1 Domain Authentication (Recommended)
For production, authenticate your domain:

1. Go to **Settings** → **Sender Authentication**
2. Choose **Authenticate Your Domain**
3. Add DNS records to your domain
4. Use your domain for `EMAIL_FROM`

### 6.2 SendGrid Settings
1. **IP Warming**: Gradually increase email volume
2. **Suppression Lists**: Monitor bounced emails
3. **Email Validation**: Enable email validation
4. **Monitoring**: Set up alerts for delivery issues

## Step 7: Monitoring & Maintenance

### 7.1 SendGrid Dashboard
Monitor email performance:
- **Delivery Rate**: Should be >99%
- **Open Rate**: Track engagement
- **Click Rate**: Measure CTA effectiveness
- **Bounce Rate**: Keep under 2%

### 7.2 Error Handling
The application includes comprehensive error handling:
- Failed emails are logged
- Graceful degradation if SendGrid is unavailable
- Retry logic for temporary failures

### 7.3 Rate Limiting
SendGrid has rate limits:
- Free tier: 100 emails/day
- Paid plans: Higher limits based on plan
- Implement queuing for high-volume scenarios

## Troubleshooting

### Common Issues

#### 401 Unauthorized
- Check API key is correct
- Ensure API key has proper permissions

#### 403 Forbidden
- Verify sender email is authenticated
- Check domain authentication status

#### Emails Going to Spam
- Authenticate your domain
- Use consistent sender address
- Avoid spam trigger words
- Monitor reputation metrics

#### High Bounce Rate
- Clean your email list regularly
- Use double opt-in for subscriptions
- Monitor invalid email addresses

## Performance Comparison

| Service | Delivery Speed | Reliability | Cost | Setup Complexity |
|---------|----------------|-------------|------|------------------|
| Nodemailer | Variable | Medium | Free | High |
| SendGrid | Fast (<2s) | High (99.9%) | Free tier + Paid | Low |

## Migration Benefits

✅ **Faster Delivery**: Emails delivered in seconds vs minutes
✅ **Better Reliability**: 99.9% uptime with retry logic
✅ **Advanced Analytics**: Detailed delivery, open, and click tracking
✅ **Spam Protection**: Built-in spam filtering and reputation management
✅ **Scalability**: Handles high volume without performance impact

## Next Steps

1. **Test thoroughly** in development environment
2. **Monitor performance** after deployment
3. **Set up alerts** for delivery issues
4. **Consider upgrading** SendGrid plan for higher volume
5. **Implement email templates** for additional use cases

---

**Note**: This setup provides production-ready email functionality with fast delivery, high reliability, and comprehensive monitoring capabilities.