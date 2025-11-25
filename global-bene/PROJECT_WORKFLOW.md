# Global Bene - Professional Networking & Community Platform

## Overview

Global Bene is a comprehensive social networking platform designed for professional networking, community building, and knowledge sharing. It combines features from Reddit, LinkedIn, and modern social platforms with advanced AI-powered recommendations and content management.

## Core Features

### 🔐 Authentication & User Management
- Google OAuth integration
- Email verification system
- JWT-based authentication
- Role-based access control (User, Admin)
- Profile management with customizable fields

### 📝 Advanced Content System
- **Flexible Post Structure**: Support for text, images, and links in any combination
- **Rich Media Support**: Cloudinary integration for image uploads
- **Content Moderation**: Spam detection and automated filtering
- **Tagging System**: Manual and AI-powered auto-tagging

### 🤖 AI-Powered Auto-Tagging System

#### What is Auto-Tagging?
Auto-tagging is an intelligent content analysis system that automatically generates relevant tags and topics from post/comment content using external AI APIs. It enhances content discoverability and powers the recommendation engine.

#### External AI API Integration

The system integrates with **Hugging Face Spaces AI API** at `https://saisuchendar-autotagapi2.hf.space/predict`:

- **API Endpoint**: `POST /predict`
- **Input**: `{ "text": "content to analyze" }`
- **Output**: `{ "tags": ["tag1", "tag2", ...] }`
- **Fallback**: Local keyword extraction if API unavailable

#### How Auto-Tagging Works

1. **Content Analysis**: When a post/comment is created, the system analyzes:
   - Post title and text content
   - Image captions
   - Link titles and descriptions

2. **AI API Call**: Sends combined text to external AI service:
   ```javascript
   const response = await axios.post('https://saisuchendar-autotagapi2.hf.space/predict', {
     text: combinedContent
   });
   ```

3. **Topic Classification**: Maps AI-generated tags to broader topics:
   ```javascript
   const topicMappings = {
     'javascript': ['technology', 'programming', 'web-development'],
     'python': ['technology', 'programming', 'data-science'],
     'react': ['technology', 'programming', 'web-development', 'frontend'],
     // ... comprehensive mappings
   }
   ```

4. **Tag Merging**: Combines manual user tags with AI-generated tags

5. **Database Storage**: Stores both manual and auto-generated tags separately

#### Auto-Tagging Workflow

```
User creates post → Content submitted → Spam check → AI API call → Topic mapping → Tag storage → Post published
                                      ↓
                               External AI Service
                                      ↓
                            Tag Generation
                                      ↓
                           Topic Classification
                                      ↓
                        Tag Merging & Storage
```

#### Configuration

Set environment variables for API integration:
```env
AUTOTAG_API_URL=https://saisuchendar-autotagapi2.hf.space
AUTOTAG_API_KEY=your_api_key_if_required
```

#### Error Handling & Resilience

- **Timeout Protection**: 10-second timeout on API calls
- **Fallback System**: Local keyword extraction if API fails
- **Non-blocking**: Auto-tagging failures don't prevent content creation
- **Logging**: Comprehensive error logging for debugging

### 🎯 Advanced ML-Powered Recommendation Engine

#### Hybrid Recommendation System
The platform now features a sophisticated ML-based recommendation engine with multiple algorithms:

- **Collaborative Filtering**: User similarity based on voting patterns and interactions
- **Content-Based Filtering**: Tag and topic matching with embeddings
- **Heuristic Scoring**: Community matching, popularity, and user activity
- **Cold-Start Handling**: Special logic for new users with no interaction history

#### Technical Implementation
- **Separate Python Service**: FastAPI-based recommendation API running on port 8000
- **Advanced Algorithms**: Uses FAISS for indexing, SBERT for embeddings, and scikit-learn for ML
- **Caching System**: Upstash Redis for fast recommendation retrieval
- **Background Processing**: Asynchronous recommendation generation
- **Fallback Integration**: Graceful degradation to rule-based system if ML service unavailable

#### Recommendation Features
- **Post Recommendations**: ML-powered personalized post suggestions
- **Community Suggestions**: Communities aligned with user preferences
- **User Follow Suggestions**: Similar users and active contributors
- **Real-time Updates**: Background refresh of recommendations

#### Algorithm Details
1. **Data Collection**: User interactions, votes, community memberships
2. **Feature Engineering**: User profiles, content embeddings, similarity matrices
3. **Model Training**: Collaborative filtering with cosine similarity
4. **Scoring & Ranking**: Hybrid scoring combining multiple signals
5. **Caching & Serving**: Redis-based storage with TTL for performance

### 👥 Community Management
- **Public & Private Communities**: Flexible privacy settings
- **Membership Management**: Join/leave functionality
- **Community Moderation**: Admin controls and spam management
- **Content Organization**: Community-specific post categorization

### 💬 Advanced Commenting System
- **Nested Replies**: Threaded conversations
- **Vote System**: Upvote/downvote comments
- **Real-time Updates**: Live comment loading
- **Comment Moderation**: Spam detection and reporting

### 📊 Analytics & Insights
- **User Engagement Metrics**: Views, likes, comments, shares
- **Content Performance**: Post analytics and trending detection
- **Admin Dashboard**: Comprehensive platform statistics
- **Interaction Logging**: Detailed user behavior tracking

### 🔍 Advanced Search & Discovery
- **Multi-field Search**: Title, content, tags, topics, author
- **Filter Options**: Category, date range, community, author
- **Search Analytics**: Popular search terms and trends
- **Smart Suggestions**: Auto-complete and related content

## Technical Architecture

### Backend Stack
- **Node.js** with Express.js framework
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Cloudinary** for media management
- **Nodemailer** for email services

### Frontend Stack
- **React** with modern hooks and context
- **Tailwind CSS** for responsive styling
- **Axios** for API communication
- **React Router** for navigation

### Database Schema

#### User Model
```javascript
{
  username, email, password,
  profile: { avatarUrl, bio, mobile, gender, dob },
  interests: [String],
  preferredTags: [String],
  following: [ObjectId],
  followers: [ObjectId],
  // Analytics fields
  totalLikesGiven, totalLikesReceived,
  totalViews, totalSaves
}
```

#### Post Model
```javascript
{
  title,
  content: {
    text: String,
    images: [{ public_id, secure_url, caption }],
    links: [{ url, title, description, thumbnail }]
  },
  author: ObjectId,
  community: ObjectId,
  tags: [String],
  autoTags: [String],
  topics: [String],
  category: String,
  // Engagement metrics
  upvotes: [ObjectId], downvotes: [ObjectId],
  likedBy: [ObjectId], savedBy: [ObjectId],
  comments: [ObjectId],
  score, viewCount, commentCount
}
```

#### Comment Model
```javascript
{
  content: String,
  author: ObjectId,
  post: ObjectId,
  parentComment: ObjectId,
  replies: [ObjectId],
  upvotes: [ObjectId], downvotes: [ObjectId],
  autoTags: [String],
  score, likeCount
}
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/google` - Google OAuth
- `GET /api/auth/verify/:token` - Email verification

### Posts
- `GET /api/posts` - Get posts with filtering/pagination
- `POST /api/posts` - Create new post
- `GET /api/posts/:id` - Get single post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/vote` - Vote on post
- `DELETE /api/posts/:id/vote` - Remove vote
- `POST /api/posts/:id/save` - Save/unsave post

### Comments
- `GET /api/comments/post/:postId` - Get post comments
- `POST /api/comments/post/:postId` - Create comment
- `POST /api/comments/:id/vote` - Vote on comment
- `DELETE /api/comments/:id/vote` - Remove vote
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment

### Communities
- `GET /api/communities` - Get communities
- `POST /api/communities` - Create community
- `GET /api/communities/:id` - Get community details
- `POST /api/communities/:id/join` - Join community

### Recommendations
- `GET /api/recommendations/users/:userId/posts` - Recommended posts
- `GET /api/recommendations/users/:userId/communities` - Recommended communities
- `GET /api/recommendations/users/:userId/follow-suggestions` - User suggestions

### User Management
- `GET /api/users/me` - Get current user
- `PUT /api/users/update` - Update profile
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user profile
- `POST /api/users/:id/follow` - Follow/unfollow user

## Workflow Diagrams

### Post Creation Workflow
```
User submits post → Validate content → Spam check → Auto-tag generation → Save to DB → Update community stats → Return success
```

### Recommendation Workflow
```
User visits feed → Fetch user preferences → Query similar content → Apply scoring algorithm → Rank and filter → Return personalized results
```

### Search Workflow
```
User enters query → Parse search terms → Query multiple fields → Apply filters → Rank results → Return paginated results
```

## Security Features

- **Input Validation**: Comprehensive validation on all inputs
- **Rate Limiting**: API rate limiting to prevent abuse
- **Spam Detection**: Automated spam filtering
- **Content Moderation**: Admin controls for inappropriate content
- **Secure Authentication**: JWT with proper expiration
- **Data Sanitization**: XSS prevention and SQL injection protection

## Performance Optimizations

- **Database Indexing**: Optimized indexes for common queries
- **Caching**: Redis integration for frequently accessed data
- **Pagination**: Efficient pagination for large datasets
- **Lazy Loading**: Progressive content loading
- **CDN Integration**: Fast media delivery via Cloudinary

## Deployment & Scaling

- **Container Ready**: Docker configuration for easy deployment
- **Environment Config**: Separate configs for dev/staging/production
- **Monitoring**: Error tracking and performance monitoring
- **Backup Strategy**: Automated database backups
- **Horizontal Scaling**: Stateless design for scaling

## Future Enhancements

- **Real AI Integration**: Replace mock tagging with actual AI/ML models
- **Advanced Analytics**: Machine learning for content insights
- **Real-time Features**: WebSocket integration for live updates
- **Mobile App**: React Native companion app
- **API Marketplace**: Third-party integrations
- **Advanced Moderation**: AI-powered content moderation

---

## Quick Start

1. **Clone the repository**
2. **Install dependencies**: `npm install` (both frontend and backend)
3. **Set up environment variables** in `.env` files
4. **Start MongoDB** and configure connection
5. **Run backend**: `npm start` in backend directory
6. **Run frontend**: `npm run dev` in frontend directory
7. **Seed data**: `node scripts/seedPosts.js` for sample content

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.