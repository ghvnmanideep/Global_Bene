// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');
// const crypto = require('crypto');
// const User = require('../models/user');
// const nodemailer = require('nodemailer');
// const { OAuth2Client } = require('google-auth-library');
// const { logActivity } = require('../utils/logActivity.utils');


// // Initialize Google OAuth2 client
// const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
//   // Helper to generate JWT

// // Environment variables or defaults
// const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

// // Configure mail transporter
// const transporter = nodemailer.createTransport({
//   host: process.env.EMAIL_HOST || 'smtp.gmail.com',
//   port: process.env.EMAIL_PORT || 587,
//   secure: false,
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_APPPASS,
//   },
//   tls: { rejectUnauthorized: false },
// });

// // Helper to send email
// const sendMail = async ({ to, subject, html }) => {
//   try {
//     await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to,
//       subject,
//       html,
//     });
//   } catch (err) {
//     console.error('Email send error:', err);
//   }
// };

// // Password validation regex
// const strongPassword = (pw) =>
//   /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/.test(pw);

// // Utility to generate tokens
// const generateToken = () => crypto.randomBytes(20).toString('hex');

// // Generate 6-digit OTP
// const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// // JWT token generator
// const createAccessToken = (user) =>
//   jwt.sign({ id: user._id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '15m' });

// // --------- REGISTER ---------
// exports.register = async (req, res) => {
//   try {
//     const { username, email, password, role } = req.body;
//     const userRole = role || 'user';

//     // Validate password strength
//     if (!strongPassword(password)) {
//       return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number and symbol' });
//     }

//     // Trim and prepare data
//     const trimmedUsername = username.trim();
//     const trimmedEmail = email.trim().toLowerCase();

//     // Check existing user
//     const existingEmail = await User.findOne({ email: trimmedEmail });
//     if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

//     const existingUsername = await User.findOne({ username: trimmedUsername.toLowerCase() });
//     if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

//     // Store plain password - pre-save hook will hash it
//     const user = new User({ username: trimmedUsername, email: trimmedEmail, passwordHash: password, role: userRole });
//     await user.save();

//     // Log registration activity
//     await logActivity(
//       user._id,
//       "register",
//       `User registered with email ${trimmedEmail}`,
//       req,
//       null,
//       null
//     );

//     // Generate email verification OTP
//     const otp = generateOTP();
//     user.otpCode = otp;
//     user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
//     await user.save();

//     const html = `
//       <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
//         <tr>
//           <td align="center">
//             <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
//               <tr>
//                 <td style="padding:28px 32px;border-bottom:1px solid #1f2937;">
//                   <table width="100%">
//                     <tr>
//                       <td align="left" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;font-size:18px;font-weight:700;letter-spacing:.2px;">
//                         Global Bene
//                       </td>
//                       <td align="right" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:12px;">
//                         Account Verification
//                       </td>
//                     </tr>
//                   </table>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
//                   <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Hi ${username}, verify your email</h1>
//                   <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
//                     Thanks for signing up for Global Bene. Please verify your email address to complete your registration.
//                   </p>
//                   <div style="text-align:center;margin:26px 0 8px;">
//                     <div style="display:inline-block;background:#f97316;color:#0b1220;padding:16px 24px;border-radius:12px;font-weight:700;font-size:24px;letter-spacing:4px;border:1px solid #fb923c;">
//                       ${otp}
//                     </div>
//                   </div>
//                   <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">This code expires in 10 minutes. Do not share it with anyone.</p>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
//                   You received this email because you created an account on Global Bene.
//                 </td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//       </table>`;

//     await sendMail({ to: email, subject: 'Verify your email • Global Bene', html });

//     res.status(201).json({ message: 'Registered successfully. Check your email.' });
//   } catch (err) {
//     console.error('Registration error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // --------- OTP VERIFICATION ---------
// exports.verifyOtp = async (req, res) => {
//   try {
//     const { email, otp } = req.body;
//     const user = await User.findOne({ email, otpCode: otp, otpExpires: { $gt: Date.now() } });
//     if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

//     user.emailVerified = true;
//     user.otpCode = undefined;
//     user.otpExpires = undefined;
//     await user.save();

//     // Log email verification activity
//     await logActivity(
//       user._id,
//       "verify-otp",
//       `User verified email with OTP`,
//       req,
//       null,
//       null
//     );

//     const html = `
//       <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
//         <tr>
//           <td align="center">
//             <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
//               <tr>
//                 <td style="padding:28px 32px;border-bottom:1px solid #1f2937;">
//                   <table width="100%">
//                     <tr>
//                       <td align="left" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;font-size:18px;font-weight:700;letter-spacing:.2px;">
//                         Global Bene
//                       </td>
//                       <td align="right" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:12px;">
//                         Welcome
//                       </td>
//                     </tr>
//                   </table>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
//                   <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Welcome to Global Bene, ${user.username}!</h1>
//                   <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
//                     Your email has been successfully verified. You can now fully access all features of Global Bene.
//                   </p>
//                   <div style="text-align:center;margin:26px 0 8px;">
//                     <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">
//                       Get Started
//                     </a>
//                   </div>
//                   <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">Explore communities, create posts, and connect with others.</p>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
//                   You received this email because you verified your account on Global Bene.
//                 </td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//       </table>`;
//     await sendMail({ to: user.email, subject: 'Welcome to Global Bene!', html });
//     res.json({ message: 'Email verified successfully' });
//   } catch (err) {
//     console.error('OTP verify error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // --------- LOGIN ---------
// exports.login = async (req, res) => {
//   try {
//     const { username, email, password } = req.body;
//     const loginIdentifier = username || email;
//     // console.log('Login attempt:', { loginIdentifier, password: !!password });

//     if (!loginIdentifier || !password)
//       return res.status(400).json({ message: 'Username/email and password are required' });

//     // Find user by username or email
//     const user = await User.findOne({ 
//       $or: [{ username: loginIdentifier }, { email: loginIdentifier }] 
//     });
//     if (!user) {
//       console.log('User not found');
//       return res.status(400).json({ message: 'Invalid username or password' });
//     }

//     if (!user.passwordHash) {
//       return res.status(400).json({ message: 'Please log in with Google for this account' });
//     }

//     const isMatch = await bcrypt.compare(password, user.passwordHash);
//     // console.log('Password match:', isMatch);
//     if (!isMatch)
//       return res.status(400).json({ message: 'Invalid username or password' });

//     const token = createAccessToken(user);

//     // Log login activity
//     await logActivity(
//       user._id,
//       "login",
//       `User logged in successfully`,
//       req,
//       null,
//       null
//     );

//     // Send welcome email on successful login only for non-admin users
//     if (user.role !== 'admin') {
//       const welcomeHtml = `
//         <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
//           <tr>
//             <td align="center">
//               <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
//                 <tr>
//                   <td style="padding:28px 32px;border-bottom:1px solid #1f2937;">
//                     <table width="100%">
//                       <tr>
//                         <td align="left" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;font-size:18px;font-weight:700;letter-spacing:.2px;">
//                           Global Bene
//                         </td>
//                         <td align="right" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:12px;">
//                           Welcome Back
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
//                     <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Welcome back, ${user.username}!</h1>
//                     <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
//                       You have successfully logged in to Global Bene. Enjoy exploring communities and connecting with others.
//                     </p>
//                     <div style="text-align:center;margin:26px 0 8px;">
//                       <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">
//                         Go to Dashboard
//                       </a>
//                     </div>
//                     <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">If you didn't log in, please secure your account immediately.</p>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
//                     You received this email because you logged in to Global Bene.
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//         </table>`;
//       await sendMail({ to: user.email, subject: 'Welcome back to Global Bene!', html: welcomeHtml });
//     }

//     res.json({
//       accessToken: token,
//       token, // Keep both for backward compatibility
//       _id: user._id.toString(),
//       username: user.username,
//       role: user.role || 'user',
//     });
//   } catch (err) {
//     console.error('Login error:', err);
//     res.status(500).json({ message: 'Server error during login' });
//   }
// };

// // --------- PASSWORD RESET ---------
// exports.forgotPassword = async (req, res) => {
//   try {
//     const { email } = req.body;
//     const user = await User.findOne({ email });
//     if (!user)
//       return res.json({ message: 'If email exists, reset instructions sent.' });

//     const resetToken = generateToken();
//     user.resetToken = resetToken;
//     user.resetTokenExpires = Date.now() + 3600000; // 1 hour expiry
//     await user.save();

//     // Log password reset request
//     await logActivity(
//       user._id,
//       "reset-password",
//       `User requested password reset`,
//       req,
//       null,
//       null
//     );

//     const resetLink = `${process.env.FRONTEND_URL}/reset/${resetToken}`;
//     const resetHtml = `
//       <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
//         <tr>
//           <td align="center">
//             <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
//               <tr>
//                 <td style="padding:28px 32px;border-bottom:1px solid #1f2937;">
//                   <span style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;font-size:18px;font-weight:700;">Global Bene</span>
//                 </td>
//               </tr>
//               <tr>
//                 <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
//                   <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Reset your password</h1>
//                   <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">Hi ${user.username}, we received a request to reset your password.</p>
//                   <div style="text-align:center;margin:26px 0 8px;">
//                     <a href="${resetLink}" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">Reset Password</a>
//                   </div>
//                   <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">This link expires in 1 hour. If you didn’t request this, you can ignore this email.</p>
//                   <div style="margin-top:22px;padding:14px;border:1px solid #1f2937;border-radius:10px;background:#0f172a;color:#94a3b8;font-size:12px;">
//                     If the button doesn't work, copy and paste this URL into your browser:<br />
//                     <span style="color:#e5e7eb;word-break:break-all;">${resetLink}</span>
//                   </div>
//                 </td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//       </table>`;
//     await sendMail({ to: email, subject: 'Reset your password • Global Bene', html: resetHtml });
//     res.json({ message: 'If email exists, reset instructions sent.' });
//   } catch (err) {
//     console.error('Forgot password error:', err);
//     res.status(500).json({ message: 'Failed to send reset email' });
//   }
// };

// exports.resetPassword = async (req, res) => {
//   try {
//     const { token } = req.params;
//     const { newPassword } = req.body;
//     if (!strongPassword(newPassword))
//       return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number and symbol' });

//     const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });
//     if (!user)
//       return res.status(400).json({ message: 'Invalid or expired token' });

//     // Store plain password - pre-save hook will hash it
//     user.passwordHash = newPassword;
//     user.resetToken = undefined;
//     user.resetTokenExpires = undefined;
//     await user.save();

//     // Log password change activity
//     await logActivity(
//       user._id,
//       "change-password",
//       `User changed password via reset link`,
//       req,
//       null,
//       null
//     );

//     const confirmHtml = `
//       <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
//         <tr>
//           <td align="center">
//             <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
//               <tr>
//                 <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
//                   <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Password changed</h1>
//                   <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#cbd5e1;">Your password has been reset successfully.</p>
//                   <p style="margin:0;font-size:12px;color:#94a3b8;">If you didn’t make this change, please contact support immediately.</p>
//                 </td>
//               </tr>
//             </table>
//           </td>
//         </tr>
//       </table>`;
//     await sendMail({ to: user.email, subject: 'Your password was changed • Global Bene', html: confirmHtml });
//     res.json({ message: 'Password has been updated' });
//   } catch (err) {
//     console.error('Reset password error:', err);
//     res.status(500).json({ message: 'Failed to reset password' });
//   }
// };

// // --------- GET MY PROFILE ---------
// exports.getMe = async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id).select('-passwordHash -resetToken -emailToken');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json(user);
//   } catch (err) {
//     console.error('Get profile error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


// // --------- FOLLOW USER ---------
// exports.followUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const currentUserId = req.user.id;

//     if (userId === currentUserId) {
//       return res.status(400).json({ message: 'Cannot follow yourself' });
//     }

//     const userToFollow = await User.findById(userId);
//     const currentUser = await User.findById(currentUserId);

//     if (!userToFollow || !currentUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     if (currentUser.following.includes(userId)) {
//       return res.status(400).json({ message: 'Already following this user' });
//     }

//     currentUser.following.push(userId);
//     userToFollow.followers.push(currentUserId);

//     await currentUser.save();
//     await userToFollow.save();

//     // Log follow activity
//     await logActivity(
//       currentUserId,
//       "follow-user",
//       `User followed ${userToFollow.username}`,
//       req,
//       "user",
//       userId
//     );

//     res.json({ message: 'User followed successfully' });
//   } catch (err) {
//     console.error('Follow user error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // --------- UNFOLLOW USER ---------
// exports.unfollowUser = async (req, res) => {
//   try {
//     const { userId } = req.params;
//     const currentUserId = req.user.id;

//     const userToUnfollow = await User.findById(userId);
//     const currentUser = await User.findById(currentUserId);

//     if (!userToUnfollow || !currentUser) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
//     userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);

//     await currentUser.save();
//     await userToUnfollow.save();

//     // Log unfollow activity
//     await logActivity(
//       currentUserId,
//       "unfollow-user",
//       `User unfollowed ${userToUnfollow.username}`,
//       req,
//       "user",
//       userId
//     );

//     res.json({ message: 'User unfollowed successfully' });
//   } catch (err) {
//     console.error('Unfollow user error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // --------- GET USER BY ID ---------
// exports.getUserById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findById(id).select('-passwordHash -resetToken -emailToken');
//     if (!user) return res.status(404).json({ message: 'User not found' });
//     res.json(user);
//   } catch (err) {
//     console.error('Get user by ID error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // --------- UPDATE PROFILE ---------
// exports.updateProfile = async (req, res) => {
//   try {
//     const { bio, mobile, gender, dob, username } = req.body;
//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Handle username change
//     if (username !== undefined) {
//       const trimmedUsername = username.trim();
//       const lowerUsername = trimmedUsername.toLowerCase();
//       if (lowerUsername !== user.username.toLowerCase()) {
//         // Check if new username is taken by another user
//         const existingUsername = await User.findOne({ username: lowerUsername });
//         if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
//           return res.status(400).json({ message: 'Username already exists' });
//         }
//         user.username = lowerUsername;
//       }
//     }

//     if (req.file && req.file.path) {
//       user.profile.avatarUrl = req.file.path;
//       if (req.file.filename) user.profile.avatarPublicId = req.file.filename;
//     }

//     user.profile = {
//       ...user.profile,
//       bio: bio || user.profile?.bio,
//       mobile: mobile || user.profile?.mobile,
//       gender: gender || user.profile?.gender,
//       dob: dob || user.profile?.dob,
//       avatarUrl: user.profile.avatarUrl,
//     };

//     await user.save();

//     // Log profile update activity
//     await logActivity(
//       req.user._id,
//       "update-profile",
//       `User updated profile information`,
//       req,
//       null,
//       null
//     );

//     res.json({ message: 'Profile updated', profile: user.profile, username: user.username });
//   } catch (err) {
//     console.error('Update profile error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };

// // --------- CHANGE PASSWORD ---------
// exports.changePassword = async (req, res) => {
//   try {
//     const { newPassword } = req.body;
//     if (!strongPassword(newPassword))
//       return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number and symbol' });

//     const user = await User.findById(req.user.id);
//     if (!user) return res.status(404).json({ message: 'User not found' });

//     // Store plain password - pre-save hook will hash it
//     user.passwordHash = newPassword;
//     user.refreshTokens = [];
//     await user.save();

//     // Log password change activity
//     await logActivity(
//       req.user._id,
//       "change-password",
//       `User changed password`,
//       req,
//       null,
//       null
//     );

//     res.json({ message: 'Password changed successfully' });
//   } catch (err) {
//     console.error('Change password error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };



// // ------------------------ GOOGLE LOGIN ------------------------
// exports.googleAuth = async (req, res) => {
//   try {
//     const { token } = req.body;
//     if (!token) return res.status(400).json({ message: "Missing Google token" });

//     // Verify token
//     const ticket = await client.verifyIdToken({
//       idToken: token,
//       audience: process.env.GOOGLE_CLIENT_ID,
//     });
//     const payload = ticket.getPayload();

//     const { email, name, picture, sub } = payload;

//     let user = await User.findOne({ email });

//     if (!user) {
//       // New user
//       user = new User({
//         username: name.replace(/\s+/g, "").toLowerCase(),
//         email,
//         googleId: sub,
//         emailVerified: true,
//         profile: { avatarUrl: picture },
//       });
//       await user.save();
//     }

//     // Generate JWT
//     const accessToken = createAccessToken(user);

//     // Log Google login activity
//     await logActivity(
//       user._id,
//       "login",
//       `User logged in with Google`,
//       req,
//       null,
//       null
//     );

//     // Send welcome email on successful Google sign-in only for non-admin users
//     if (user.role !== 'admin') {
//       const welcomeHtml = `
//         <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background:#0f172a;padding:32px 0;">
//           <tr>
//             <td align="center">
//               <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width:600px;background:#0b1220;border-radius:12px;border:1px solid #1f2937;box-shadow:0 10px 25px rgba(0,0,0,.25);">
//                 <tr>
//                   <td style="padding:28px 32px;border-bottom:1px solid #1f2937;">
//                     <table width="100%">
//                       <tr>
//                         <td align="left" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;font-size:18px;font-weight:700;letter-spacing:.2px;">
//                           Global Bene
//                         </td>
//                         <td align="right" style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#9ca3af;font-size:12px;">
//                           Welcome Back
//                         </td>
//                       </tr>
//                     </table>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
//                     <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Welcome back, ${user.username}!</h1>
//                     <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
//                       You have successfully signed in to Global Bene with Google. Enjoy exploring communities and connecting with others.
//                     </p>
//                     <div style="text-align:center;margin:26px 0 8px;">
//                       <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">
//                         Go to Dashboard
//                       </a>
//                     </div>
//                     <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">If you didn't sign in, please secure your account immediately.</p>
//                   </td>
//                 </tr>
//                 <tr>
//                   <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
//                     You received this email because you signed in to Global Bene with Google.
//                   </td>
//                 </tr>
//               </table>
//             </td>
//           </tr>
//         </table>`;
//       await sendMail({ to: user.email, subject: 'Welcome back to Global Bene!', html: welcomeHtml });
//     }

//     res.status(200).json({
//       success: true,
//       message: "Google login successful",
//       user: {
//         _id: user._id,
//         username: user.username,
//         email: user.email,
//         role: user.role || "user",
//       },
//       token: accessToken,
//     });
//   } catch (error) {
//     console.error("Google Auth Error:", error);
//     res.status(500).json({ message: "Server error during Google authentication" });
//   }
// };
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/user');
const nodemailer = require('nodemailer');
const { OAuth2Client } = require('google-auth-library');
const { logActivity } = require('../utils/logActivity.utils');


// Initialize Google OAuth2 client
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  // Helper to generate JWT

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

// Helper to send email - TEMPORARILY DISABLED FOR TESTING
const sendMail = async ({ to, subject, html }) => {
  // TEMPORARY: Skip email sending for testing core functionality
  console.log('📧 Email sending disabled for testing - would send to:', to, 'Subject:', subject);

  // Uncomment below to re-enable email sending
  /*
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
  */
};

// Password validation regex
const strongPassword = (pw) =>
  /^(?=.{8,}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).*$/.test(pw);

// Utility to generate tokens
const generateToken = () => crypto.randomBytes(20).toString('hex');

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// JWT token generator
const createAccessToken = (user) =>
  jwt.sign({ id: user._id, username: user.username, role: user.role || 'user' }, JWT_SECRET, { expiresIn: '15m' });

// --------- REGISTER ---------
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    const userRole = role || 'user';

    // Validate password strength
    if (!strongPassword(password)) {
      return res.status(400).json({ message: 'Password must be at least 8 characters, include uppercase, lowercase, number and symbol' });
    }

    // Trim and prepare data
    const trimmedUsername = username.trim();
    const trimmedEmail = email.trim().toLowerCase();

    // Check existing user
    const existingEmail = await User.findOne({ email: trimmedEmail });
    if (existingEmail) return res.status(400).json({ message: 'Email already exists' });

    const existingUsername = await User.findOne({ username: trimmedUsername.toLowerCase() });
    if (existingUsername) return res.status(400).json({ message: 'Username already exists' });

    // Store plain password - pre-save hook will hash it
    const user = new User({ username: trimmedUsername, email: trimmedEmail, passwordHash: password, role: userRole });
    await user.save();

    // Log registration activity
    await logActivity(
      user._id,
      "register",
      `User registered with email ${trimmedEmail}`,
      req,
      null,
      null
    );

    // TEMPORARY: Skip email verification for testing - auto-verify user
    user.emailVerified = true;
    await user.save();

    // Log registration activity
    await logActivity(
      user._id,
      "register",
      `User registered and auto-verified for testing`,
      req,
      null,
      null
    );

    // Generate access token for immediate login
    const token = createAccessToken(user);

    res.status(201).json({
      message: 'Registered and verified successfully!',
      accessToken: token,
      _id: user._id.toString(),
      username: user.username,
      role: user.role || 'user',
    });

    // Original email verification code (commented out for testing)
    /*
    // Generate email verification OTP
    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes expiry
    await user.save();

    const html = `...`; // Email HTML template

    await sendMail({ to: email, subject: 'Verify your email • Global Bene', html });

    res.status(201).json({ message: 'Registered successfully. Check your email.' });
    */
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- OTP VERIFICATION ---------
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email, otpCode: otp, otpExpires: { $gt: Date.now() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP' });

    user.emailVerified = true;
    user.otpCode = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Log email verification activity
    await logActivity(
      user._id,
      "verify-otp",
      `User verified email with OTP`,
      req,
      null,
      null
    );

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
                        Welcome
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              <tr>
                <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
                  <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Welcome to Global Bene, ${user.username}!</h1>
                  <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
                    Your email has been successfully verified. You can now fully access all features of Global Bene.
                  </p>
                  <div style="text-align:center;margin:26px 0 8px;">
                    <a href="${process.env.FRONTEND_URL}/login" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">
                      Get Started
                    </a>
                  </div>
                  <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">Explore communities, create posts, and connect with others.</p>
                </td>
              </tr>
              <tr>
                <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
                  You received this email because you verified your account on Global Bene.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>`;
    await sendMail({ to: user.email, subject: 'Welcome to Global Bene!', html });
    res.json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error('OTP verify error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- LOGIN ---------
exports.login = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const loginIdentifier = username || email;
    // console.log('Login attempt:', { loginIdentifier, password: !!password });

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
    // console.log('Password match:', isMatch);
    if (!isMatch)
      return res.status(400).json({ message: 'Invalid username or password' });

    const token = createAccessToken(user);

    // Log login activity
    await logActivity(
      user._id,
      "login",
      `User logged in successfully`,
      req,
      null,
      null
    );

    // Send welcome email on successful login only for non-admin users
    if (user.role !== 'admin') {
      const welcomeHtml = `
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
                          Welcome Back
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
                    <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Welcome back, ${user.username}!</h1>
                    <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
                      You have successfully logged in to Global Bene. Enjoy exploring communities and connecting with others.
                    </p>
                    <div style="text-align:center;margin:26px 0 8px;">
                      <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">
                        Go to Dashboard
                      </a>
                    </div>
                    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">If you didn't log in, please secure your account immediately.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
                    You received this email because you logged in to Global Bene.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
      await sendMail({ to: user.email, subject: 'Welcome back to Global Bene!', html: welcomeHtml });
    }

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

    // Log password reset request
    await logActivity(
      user._id,
      "reset-password",
      `User requested password reset`,
      req,
      null,
      null
    );

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

    // Log password change activity
    await logActivity(
      user._id,
      "change-password",
      `User changed password via reset link`,
      req,
      null,
      null
    );

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
    const user = await User.findById(req.user._id).select('-passwordHash -resetToken -emailToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};


// --------- FOLLOW USER ---------
exports.followUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    if (userId === currentUserId) {
      return res.status(400).json({ message: 'Cannot follow yourself' });
    }

    const userToFollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (currentUser.following.includes(userId)) {
      return res.status(400).json({ message: 'Already following this user' });
    }

    currentUser.following.push(userId);
    userToFollow.followers.push(currentUserId);

    await currentUser.save();
    await userToFollow.save();

    // Log follow activity
    await logActivity(
      currentUserId,
      "follow-user",
      `User followed ${userToFollow.username}`,
      req,
      "user",
      userId
    );

    res.json({ message: 'User followed successfully' });
  } catch (err) {
    console.error('Follow user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- UNFOLLOW USER ---------
exports.unfollowUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const userToUnfollow = await User.findById(userId);
    const currentUser = await User.findById(currentUserId);

    if (!userToUnfollow || !currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== userId);
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUserId);

    await currentUser.save();
    await userToUnfollow.save();

    // Log unfollow activity
    await logActivity(
      currentUserId,
      "unfollow-user",
      `User unfollowed ${userToUnfollow.username}`,
      req,
      "user",
      userId
    );

    res.json({ message: 'User unfollowed successfully' });
  } catch (err) {
    console.error('Unfollow user error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- GET USER BY ID ---------
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id).select('-passwordHash -resetToken -emailToken');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Get user by ID error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// --------- UPDATE PROFILE ---------
exports.updateProfile = async (req, res) => {
  try {
    const { bio, mobile, gender, dob, username } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Handle username change
    if (username !== undefined) {
      const trimmedUsername = username.trim();
      const lowerUsername = trimmedUsername.toLowerCase();
      if (lowerUsername !== user.username.toLowerCase()) {
        // Check if new username is taken by another user
        const existingUsername = await User.findOne({ username: lowerUsername });
        if (existingUsername && existingUsername._id.toString() !== user._id.toString()) {
          return res.status(400).json({ message: 'Username already exists' });
        }
        user.username = lowerUsername;
      }
    }

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

    // Log profile update activity
    await logActivity(
      req.user._id,
      "update-profile",
      `User updated profile information`,
      req,
      null,
      null
    );

    res.json({ message: 'Profile updated', profile: user.profile, username: user.username });
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

    // Log password change activity
    await logActivity(
      req.user._id,
      "change-password",
      `User changed password`,
      req,
      null,
      null
    );

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



// ------------------------ GOOGLE LOGIN ------------------------
exports.googleAuth = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Missing Google token" });

    // Verify token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();

    const { email, name, picture, sub } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // New user
      user = new User({
        username: name.replace(/\s+/g, "").toLowerCase(),
        email,
        googleId: sub,
        emailVerified: true,
        profile: { avatarUrl: picture },
      });
      await user.save();
    }

    // Generate JWT
    const accessToken = createAccessToken(user);

    // Log Google login activity
    await logActivity(
      user._id,
      "login",
      `User logged in with Google`,
      req,
      null,
      null
    );

    // Send welcome email on successful Google sign-in only for non-admin users
    if (user.role !== 'admin') {
      const welcomeHtml = `
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
                          Welcome Back
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:28px 32px;font-family:Inter,Segoe UI,Arial,sans-serif;color:#e5e7eb;">
                    <h1 style="margin:0 0 12px;font-size:20px;line-height:28px;font-weight:700;color:#f3f4f6;">Welcome back, ${user.username}!</h1>
                    <p style="margin:0 0 18px;font-size:14px;line-height:22px;color:#cbd5e1;">
                      You have successfully signed in to Global Bene with Google. Enjoy exploring communities and connecting with others.
                    </p>
                    <div style="text-align:center;margin:26px 0 8px;">
                      <a href="${process.env.FRONTEND_URL}/dashboard" style="display:inline-block;background:#f97316;color:#0b1220;text-decoration:none;padding:12px 20px;border-radius:999px;font-weight:700;font-size:14px;border:1px solid #fb923c;">
                        Go to Dashboard
                      </a>
                    </div>
                    <p style="margin:16px 0 0;font-size:12px;color:#94a3b8;text-align:center;">If you didn't sign in, please secure your account immediately.</p>
                  </td>
                </tr>
                <tr>
                  <td style="padding:16px 32px;border-top:1px solid #1f2937;color:#64748b;font-family:Inter,Segoe UI,Arial,sans-serif;font-size:12px;">
                    You received this email because you signed in to Global Bene with Google.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>`;
      await sendMail({ to: user.email, subject: 'Welcome back to Global Bene!', html: welcomeHtml });
    }

    res.status(200).json({
      success: true,
      message: "Google login successful",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role || "user",
      },
      token: accessToken,
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ message: "Server error during Google authentication" });
  }
};
