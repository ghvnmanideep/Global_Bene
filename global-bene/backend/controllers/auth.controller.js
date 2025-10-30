const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const nodemailer = require('nodemailer');

// Environment variables or defaults
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// Configure mail transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: process.env.EMAIL_PORT || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APPPASS,
  },
  tls: { rejectUnauthorized: false },
});

// Helper to send email
const sendMail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
    });
  } catch (err) {
    console.error('Email send error:', err);
  }
};

// Password validation regex
const strongPassword = (pw) =>
  /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/.test(pw);

// Utility to generate tokens
const generateToken = () => crypto.randomBytes(20).toString('hex');

// JWT token generator
const createAccessToken = (user) =>
  jwt.sign({ id: user._id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '15m' });

// --------- REGISTER ---------
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const userRole = role || 'user';

    // Check existing user
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(400).json({ message: 'User already exists' });

    // Store plain password - pre-save hook will hash it
    const user = new User({ username, email, passwordHash: password, role: userRole });
    await user.save();

    // Generate email verification token
    const emailToken = generateToken();
    user.emailToken = emailToken;
    await user.save();

    const verifyLink = `${process.env.FRONTEND_URL}/verify/${emailToken}`;
    const html = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
              <tr>
                <td style="padding:28px 32px;border-bottom:1px solid #1f2937;">
                  <table width="100%">
                    <tr>
                      <td align="left" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;font-size:18px;font-weight:700;letter-spacing:.2px;">
                        Global Bene
                      </td>
                      <td align="right" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:12px;">
                        Account Verification
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
                  <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Hi ${username}, confirm your email</h1>
                  <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
                    Thanks for signing up for Global Bene. Please verify your email address to complete your registration and keep your account secure.
                  </p>
                  <div style="text-align:center;margin:26px 0 8px;">
                    <a href="${verifyLink}" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">
                      Verify Email
                    </a>
                  </div>
                  <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">This link expires in 24 hours.</p>
                  <div style="margin-top:22px;padding:14px;border:1px solid #1f2937;border-radius:10px;background:#0f172a;color:#94a3b8;font-size:12px;">
                    If the button doesn't work, copy and paste this URL into your browser:<br />
                    <span style="color:#e5e7eb;word-break:break-all;">${verifyLink}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
                  You received this email because you created an account on Global Bene.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;

    await sendMail({ to: email, subject: 'Confirm your email • Global Bene', html });

    res.status(201).json({ message: 'Registered successfully. Check your email.' });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- EMAIL VERIFICATION ---------
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;
    const user = await User.findOne({ emailToken: token });
    if (!user) return res.status(400).json({ message: 'Invalid token' });

    user.emailVerified = true;
    user.emailToken = undefined;
    await user.save();

    const html = `<p>Welcome ${user.username}! Your email is now verified.</p>`;
    await sendMail({ to: user.email, subject: 'Welcome!', html });
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('Email verify error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- LOGIN ---------
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;
    console.log('Login attempt:', { loginIdentifier, password: !!password });

    if (!loginIdentifier || !password)
      return res.status(400).json({ message: 'Username/email and password are required' });

    // Find user by username or email
    const user = await User.findOne({ 
      $or: [{ username: loginIdentifier }, { email: loginIdentifier }] 
    });
    if (!user) {
      console.log('User not found');
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    if (!user.passwordHash) {
      return res.status(400).json({ message: 'Please log in with Google for this account' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    console.log('Password match:', isMatch);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid username or password' });

    const token = createAccessToken(user);
    res.json({
      accessToken: token,
      token, // Keep both for backward compatibility
      _id: user._id.toString(),
      username: user.username,
      role: user.role || 'user',
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// --------- PASSWORD RESET ---------
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.json({ message: 'If email exists, reset instructions sent.' });

    const resetToken = generateToken();
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour expiry
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL}/reset/${resetToken}`;
    const resetHtml = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
              <tr>
                <td style="padding:28px 32px;border-bottom:1px solid #1f2937;">
                  <span style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;font-size:18px;font-weight:700;">Global Bene</span>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
                  <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Reset your password</h1>
                  <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">Hi ${user.username}, we received a request to reset your password.</p>
                  <div style="text-align:center;margin:26px 0 8px;">
                    <a href="${resetLink}" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">Reset Password</a>
                  </div>
                  <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">This link expires in 1 hour. If you didn’t request this, you can ignore this email.</p>
                  <div style="margin-top:22px;padding:14px;border:1px solid #1f2937;border-radius:10px;background:#0f172a;color:#94a3b8;font-size:12px;">
                    If the button doesn't work, copy and paste this URL into your browser:<br />
                    <span style="color:#e5e7eb;word-break:break-all;">${resetLink}</span>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    await sendMail({ to: email, subject: 'Reset your password • Global Bene', html: resetHtml });
    res.json({ message: 'If email exists, reset instructions sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ message: 'Failed to send reset email' });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;
    if (!strongPassword(newPassword))
      return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number and symbol' });

    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
    if (!user)
      return res.status(400).json({ message: 'Invalid or expired token' });

    // Store plain password - pre-save hook will hash it
    user.passwordHash = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    const confirmHtml = `
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
        <tr>
          <td align="center">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
              <tr>
                <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
                  <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Password changed</h1>
                  <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#cbd5e1;">Your password has been reset successfully.</p>
                  <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn’t make this change, please contact support immediately.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    await sendMail({ to: user.email, subject: 'Your password was changed • Global Bene', html: confirmHtml });
    res.json({ message: 'Password has been updated' });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ message: 'Failed to reset password' });
  }
};

// --------- GET MY PROFILE ---------
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash -resetToken -emailToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- UPDATE PROFILE ---------
exports.updateProfile = async (req, res) => {
  try {
    const { bio, mobile, gender, dob } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (req.file && req.file.path) {
      user.profile.avatarUrl = req.file.path;
      if (req.file.filename) user.profile.avatarPublicId = req.file.filename;
    }

    user.profile = {
      ...user.profile,
      bio: bio || user.profile?.bio,
      mobile: mobile || user.profile?.mobile,
      gender: gender || user.profile?.gender,
      dob: dob || user.profile?.dob,
      avatarUrl: user.profile.avatarUrl,
    };

    await user.save();
    res.json({ message: 'Profile updated', profile: user.profile });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- CHANGE PASSWORD ---------
exports.changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!strongPassword(newPassword))
      return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number and symbol' });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Store plain password - pre-save hook will hash it
    user.passwordHash = newPassword;
    user.refreshTokens = [];
    await user.save();
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- GOOGLE LOGIN (ID TOKEN) ---------
const { OAuth2Client } = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '551070839040-qh22gqelveth5aaiqfan1fm43v0tvs7s.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

exports.googleLogin = async (req, res) => {
  try {
    const { tokenId } = req.body;
    if (!tokenId) return res.status(400).json({ message: 'No token provided' });
    // Verify token
    const ticket = await googleClient.verifyIdToken({ idToken: tokenId, audience: GOOGLE_CLIENT_ID });
    const payload = ticket.getPayload();
    const { email, name, email_verified, sub: googleId } = payload;
    if (!email_verified) return res.status(401).json({ message: 'Google account email not verified' });

    // Try to find by email (prefer email uniqueness)
    let user = await User.findOne({ email });
    // If not, create new user
    if (!user) {
      // unique username from name or email
      let baseUsername = (name || email).replace(/\s+/g, '');
      let username = baseUsername;
      let suffix = 1;
      while (await User.findOne({ username })) username = `${baseUsername}${suffix++}`;
      user = new User({ username, email, emailVerified: true, googleId, passwordHash: '' });
      await user.save();
    } else if (!user.googleId) {
      // Link existing non-Google account with googleId (OPTIONAL: comment out if not desired)
      user.googleId = googleId;
      user.emailVerified = true;
      await user.save();
    }
    
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role || 'user' },
      JWT_SECRET,
      { expiresIn: '1d' }
    );
    // Return same as classic login
    res.json({
      token,
      _id: user._id.toString(),
      username: user.username,
      role: user.role || 'user'
    });
  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ message: 'Invalid Google token' });
  }
};