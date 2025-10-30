const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APPPASS,
  },
  tls: { rejectUnauthorized: false },
});

exports.sendMail = async (to, subject, html) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject,
    html,
  });
};

exports.wrapEmail = (title, content) => `
  <div style="background:#f8fafc;padding:24px;">
    <h2 style="color:#4f46e5;">${title}</h2>
    <div style="font-size:1.1em;color:#222;margin:20px 0">${content}</div>
    <div style="margin-top:32px;font-size:.95em;color:#888;">Global Bene Team</div>
  </div>
`;
