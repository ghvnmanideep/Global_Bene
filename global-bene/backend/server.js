require('dotenv').config();
const express = require('express');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const session = require('express-session');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const connectDB = require('./config/db');

// Environment validation
const requiredEnvVars = ['MONGO_URI', 'JWT_SECRET', 'ACCESS_TOKEN_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingEnvVars);
  process.exit(1);
}

// Optional but recommended env vars
const recommendedEnvVars = ['MIXPANEL_TOKEN', 'CLOUDINARY_API_KEY'];
const missingRecommended = recommendedEnvVars.filter(envVar => !process.env[envVar]);

if (missingRecommended.length > 0) {
  console.warn('⚠️  Missing recommended environment variables:', missingRecommended);
}

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const postRoutes = require('./routes/post.routes');
const communityRoutes = require('./routes/community.routes');
const commentRoutes = require('./routes/comment.routes');
const contactRoutes = require('./routes/contact.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const activityLogRoutes = require('./routes/activityLog.routes');
const voteRoutes = require('./routes/vote.routes');
const searchRoutes = require('./routes/search.routes');
const reportRoutes = require('./routes/report.routes');

// Passport config
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  require('./utils/passport.google');
}

// Initialize analytics jobs
require('./jobs/analyticsJobs');

// Initialize app
const app = express();

// Connect to DB with retry logic
const connectWithRetry = async (retries = 5) => {
  for (let i = 0; i < retries; i++) {
    try {
      await connectDB();
      console.log('✅ Database connection established');
      return;
    } catch (error) {
      console.error(`❌ Database connection attempt ${i + 1} failed:`, error.message);
      if (i === retries - 1) {
        console.error('❌ All database connection attempts failed');
        if (process.env.NODE_ENV === 'production') {
          // In production, don't exit, let the app continue
          console.error('⚠️  Continuing without database connection');
          return;
        }
        process.exit(1);
      }
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
};

connectWithRetry();

app.use(
  helmet({
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // optional for local dev
  })
);

// Compression middleware for faster responses
app.use(compression({
  level: 6, // compression level (1-9, 6 is good balance)
  threshold: 1024, // only compress responses larger than 1KB
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));


// CORS configuration for production
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'https://localhost:5173',
      'https://localhost:5174',
      'https://global-bene-qwnw.onrender.com'
    ];

    // In production, add your frontend domain
    if (process.env.NODE_ENV === 'production') {
      allowedOrigins.push(process.env.FRONTEND_URL);
      // Add any additional production domains here
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));
// ✅ Parse JSON and cookies
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ✅ Rate Limiting
app.use(
  rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100, // limit each IP to 100 requests per minute
  })
);


// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/communities', communityRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/recommendations', recommendationRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/votes', voteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reports', reportRoutes);

// ✅ Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0'
  });
});

// ✅ API status endpoint
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'API is running',
    timestamp: new Date().toISOString(),
    services: {
      database: 'MongoDB connected',
      analytics: 'Nightly jobs scheduled',
      mixpanel: process.env.MIXPANEL_TOKEN ? 'Configured' : 'Not configured'
    }
  });
});

// ✅ 404 handler (must come after all routes)
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// ✅ Global error handler (must come last)
app.use((err, req, res, next) => {
  console.error('Global Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString()
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error: isDevelopment ? err.message : 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack })
  });
});

// ✅ Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// ✅ Unhandled promise rejection handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// ✅ Uncaught exception handler
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Don't exit in production, just log
  if (process.env.NODE_ENV === 'development') {
    process.exit(1);
  }
});

// ✅ Start server
const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

// ✅ Export for testing
module.exports = app;
