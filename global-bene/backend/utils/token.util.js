const jwt = require('jsonwebtoken');

exports.createAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email, username: user.username, role: user.role || 'user' },
    process.env.JWT_SECRET || 'your_jwt_secret',
    { expiresIn: '15m' }
  );
};
