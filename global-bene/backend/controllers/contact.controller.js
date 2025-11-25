const { sendMail, wrapEmail } = require('../utils/email.util');

exports.sendContactEmail = async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' });
    }

    // Get user info if logged in
    const user = req.user ? await require('../models/user').findById(req.user.id) : null;

    const userEmail = user ? user.email : 'Anonymous';
    const userName = user ? user.username : 'Anonymous User';

    // Email content
    const emailContent = `
      <h2>New Contact Message</h2>
      <p><strong>From:</strong> ${userName} (${userEmail})</p>
      <p><strong>Title:</strong> ${title}</p>
      <p><strong>Message:</strong></p>
      <p>${description.replace(/\n/g, '<br>')}</p>
    `;

    // Send email to admin from user's email (display only, actual sender is Gmail account)
    const fromAddress = user ? `"${userName} <${userEmail}>"` : process.env.EMAIL_FROM;
    await sendMail(
      'manideepghvn@gmail.com',
      `Contact Form: ${title}`,
      wrapEmail(`New Contact Message from ${userName}`, emailContent),
      fromAddress
    );

    res.json({ message: 'Message sent successfully' });
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).json({ message: 'Failed to send message' });
  }
};
