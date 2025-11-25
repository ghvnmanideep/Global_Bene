const jwt = require('jsonwebtoken');
const User = require('../models/user');

exports.authRequired = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized' });
  }
};

exports.verifyJWT = async (req, res, next) => {
  try {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized, token expired' });
    }

    const decodedTokenInformation = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decodedTokenInformation?.id).select("-passwordHash -refreshTokens");

    if (!user) {
      return res.status(401).json({ message: 'Invalid AccessToken' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid AccessToken' });
  }
};

exports.customRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'You are not allowed for this action' });
    }
    next();
  };
};

exports.isCommunityCreatorOrModerator = (req, res, next) => {
  const { id } = req.params;
  const userId = req.user._id;

  // This will be set by the controller after finding the community
  // For now, just pass through - the controller will check permissions
  req.userId = userId;
  req.communityId = id;
  next();
};
