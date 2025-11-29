GlobalBene - Social Platform

A comprehensive social media platform built with React, Node.js, Express, and MongoDB. Features advanced AI-powered content moderation, real-time interactions, and comprehensive user activity logging.

🚀 Features
Core Features
User Authentication: JWT-based authentication with Google OAuth
Post Management: Create, edit, delete posts with text, images, and URLs
Community System: Create and manage communities with custom rules
Comment System: Nested comments with voting functionality
Voting System: Upvote/downvote posts and comments
Search Functionality: Search across posts, users, and communities
Real-time Notifications: Instant notifications for user interactions
Admin Dashboard: Comprehensive admin panel for content moderation
Advanced Features
AI-Powered Content Moderation: Automatic spam detection and content tagging
Activity Logging: Comprehensive user interaction tracking
Reporting System: User reporting for posts, comments, and users
Email Notifications: Automated email notifications
Cloud Storage: Cloudinary integration for media uploads
Responsive Design: Mobile-first responsive UI
🛠️ Tech Stack
Frontend
React 18 with Vite
Tailwind CSS for styling
Axios for API calls
React Router for navigation
Backend
Node.js with Express.js
MongoDB with Mongoose
JWT for authentication
Cloudinary for media storage
Nodemailer for email services
AI/ML Features
Spam Detection: ML-based content moderation
Auto-tagging: Automatic content categorization
Toxicity Detection: Content safety analysis
📋 Prerequisites
Node.js 18+
MongoDB 7+
Docker & Docker Compose (for containerized deployment)
🚀 Quick Start
Development Setup
Clone the repository

git clone https://github.com/your-username/globalbene.git
cd globalbene
Environment Configuration

# Copy environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Edit the .env files with your configuration
Install Dependencies

# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
Start MongoDB

# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:7-jammy

# Or install MongoDB locally
Seed Admin User

cd backend
npm run seed-admin
Start Development Servers

# Backend (Terminal 1)
cd backend
npm run dev

# Frontend (Terminal 2)
cd frontend
npm run dev
Access the Application

Frontend: http://localhost:5173
Backend API: http://localhost:5000
🐳 Docker Deployment
Using Docker Compose (Recommended)
Configure Environment

cp backend/.env.example backend/.env
# Edit backend/.env with your production values
Build and Run

docker-compose up -d
Access the Application

Frontend: http://localhost
Backend API: http://localhost:5000
Manual Docker Build
# Build backend
cd backend
docker build -t globalbene-backend .

# Build frontend
cd ../frontend
docker build -t globalbene-frontend .

# Run containers
docker run -d -p 5000:5000 globalbene-backend
docker run -d -p 80:80 globalbene-frontend

## 📊 Default Admin Credentials

After running the seed script, use these credentials to access the admin panel:

- **Username**: admin
- **Email**: admin@globalbene.com
- **Password**: AdminPass123!

⚠️ **Important**: Change the default admin password immediately after first login!

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Post Endpoints
- `GET /api/posts` - Get posts with filtering
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/votes/:target_type/:target_id/:vote_type` - Vote on post/comment

### Search Endpoints
- `GET /api/search/posts?q=query` - Search posts
- `GET /api/search/users?q=query` - Search users
- `GET /api/search/communities?q=query` - Search communities
- `GET /api/search/all?q=query` - Combined search

### Admin Endpoints
- `GET /api/admin/dashboard/stats` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/posts` - Post management
- `GET /api/activity-logs/my-activity-logs` - User activity logs

## 🤖 AI/ML Features

### Content Moderation
- **Spam Detection**: Automatic spam content filtering
- **Toxicity Analysis**: Content safety monitoring
- **Auto-tagging**: Intelligent content categorization

### Activity Logging
- **User Interactions**: Comprehensive tracking of all user activities
- **Analytics**: Detailed user behavior insights
- **Moderation Tools**: Advanced content moderation capabilities

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt password encryption
- **Rate Limiting**: API rate limiting protection
- **CORS Configuration**: Cross-origin resource sharing control
- **Input Validation**: Comprehensive input sanitization
- **CSRF Protection**: Cross-site request forgery prevention

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers
- Tablets
- Mobile devices
- Different screen sizes and orientations

## 🚀 Production Deployment

### Environment Setup
1. Set `NODE_ENV=production` in backend .env
2. Configure production database URL
3. Set up SSL certificates
4. Configure reverse proxy (nginx recommended)

### Performance Optimization
- Enable gzip compression
- Set up CDN for static assets
- Configure database indexing
- Implement caching strategies

### Monitoring
- Set up application logging
- Configure health checks
- Monitor performance metrics
- Set up error tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 📞 Support

For support and questions:
- Create an issue in the GitHub repository
- Check the documentation
- Review the API documentation

## 🔄 Updates

Stay updated with the latest features and security patches by regularly pulling from the main branch.

---

**Built with ❤️ using modern web technologies**
