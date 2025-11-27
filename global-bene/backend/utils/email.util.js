// SendGrid implementation - commented out for now
// Uncomment when you have a valid SendGrid API key

// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// exports.sendMail = async (to, subject, html, from = null) => {
//   const msg = {
//     to,
//     from: from || process.env.EMAIL_FROM || 'noreply@globalbene.com',
//     subject,
//     html,
//   };

//   await sgMail.send(msg);
// };

exports.wrapEmail = (title, content) => `
  <div style="background:#f8fafc;padding:24px;">
    <h2 style="color:#4f46e5;">${title}</h2>
    <div style="font-size:1.1em;color:#222;margin:20px 0">${content}</div>
    <div style="margin-top:32px;font-size:.95em;color:#888;">Global Bene Team</div>
  </div>
`;

// SendGrid notification functions - commented out for now
// Uncomment when SendGrid is properly configured

// // Send spam notification email
// exports.sendSpamNotificationEmail = async (email, username, postTitle, reason, confidence) => {
//   const subject = 'Your Post Has Been Flagged as Spam';
//   const html = exports.wrapEmail(
//     'Spam Detection Alert',
//     `
//       <p>Dear ${username},</p>
//       <p>Your post titled "<strong>${postTitle}</strong>" has been flagged as spam by our automated system.</p>
//       <p><strong>Confidence Level:</strong> ${(confidence * 100).toFixed(1)}%</p>
//       <p><strong>Reason:</strong> ${reason}</p>
//       <p>If you believe this is a mistake, please contact our support team for review.</p>
//       <p>Repeated spam posts may result in account suspension.</p>
//     `
//   );
//   await exports.sendMail(email, subject, html);
// };

// // Send ban notification email
// exports.sendBanNotificationEmail = async (email, username, reason) => {
//   const subject = 'Your Account Has Been Banned';
//   const html = exports.wrapEmail(
//     'Account Ban Notification',
//     `
//       <p>Dear ${username},</p>
//       <p>Your account has been banned due to the following reason:</p>
//       <p><strong>${reason}</strong></p>
//       <p>If you believe this is a mistake, please contact our support team for appeal.</p>
//     `
//   );
//   await exports.sendMail(email, subject, html);
// };
