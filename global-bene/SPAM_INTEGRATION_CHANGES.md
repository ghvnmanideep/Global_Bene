# Spam Detection Integration Changes

## Overview
This document outlines all the changes made to integrate the spam-toxicity-api (https://spam-toxicity-api-latest.onrender.com/docs) into the Global Benee system. The integration includes automatic spam detection, post deletion, user notifications, and account banning for repeated spam offenses.

## Date of Integration
November 5, 2025

## Files Created  

### 1. `backend/models/spamPost.js`
- **Purpose**: Model to store deleted spam posts for admin review
- **Schema Fields**:
  - `originalPostId`: Reference to the original post (optional for spam posts, required for spam comments)
  - `title`, `content`, `author`, `community`, `type`, `linkUrl`, `imageUrl`, `imagePublicId`, `tags`, `category`
  - `spamReason`: Reason for spam detection
  - `detectedAt`: Timestamp of detection
  - `deletedAt`: Timestamp of deletion
- **Indexes**: author (1), detectedAt (-1)

### 2. `backend/utils/spamDetection.js`
- **Purpose**: Utility function to check content against spam API
- **Dependencies**: Added `axios` to `package.json`
- **Function**: `checkSpam(text)` - Calls external API and returns {isSpam, confidence, reason}

### 3. `frontend/src/components/AdminSpamManagement.jsx`
- **Purpose**: Admin interface for managing automatically detected spam posts
- **Features**:
  - View all auto-deleted spam posts with pagination
  - Search and filter spam posts
  - Statistics dashboard (total spam posts, banned users, unique spammers)
  - User investigation modal showing all spam posts by a user
  - Direct ban/unban user functionality
  - Real-time user status indicators

## Files Modified

### 1. `backend/models/user.js`
- **Added Fields**:
  - `spamPostCount: Number` (default: 0) - Tracks spam posts per user
  - `isBanned: Boolean` (default: false) - User ban status
  - `bannedReason: String` - Reason for banning
  - `bannedAt: Date` - Timestamp of ban

### 2. `backend/controllers/post.controller.js`
- **Added Imports**:
  - `SpamPost`, `User`, `checkSpam`
- **Modified `createPost` Function**:
  - Added spam detection check before saving post
  - If spam detected:
    - Creates SpamPost record
    - Increments user's `spamPostCount`
    - Sends notification to user about spam post deletion
    - If `spamPostCount >= 5`: Bans user account and sends ban notification
    - Returns error response instead of creating post

### 3. `backend/controllers/comment.controller.js`
- **Added Imports**:
  - `SpamPost`, `User`, `checkSpam`
- **Modified `createComment` Function**:
  - Added spam detection check for comment content
  - If spam detected:
    - Creates SpamPost record with type 'comment'
    - Increments user's `spamPostCount`
    - Sends notification to user about spam comment deletion
    - If `spamPostCount >= 5`: Bans user account and sends ban notification
    - Returns error response instead of creating comment

### 4. `backend/controllers/admin.controller.js`
- **Added Imports**: `SpamPost`
- **Modified `getDashboardStats`**:
  - Added `bannedUsers` and `totalSpamPosts` to statistics
- **Modified `getAllUsers`**:
  - Removed spamPosts population (causing 500 error)
- **New Functions**:
  - `getSpamPosts()`: Get all spam posts with pagination and filters
  - `getUserSpamPosts(userId)`: Get spam posts by specific user
  - `toggleUserBan()`: Ban/unban users with notifications

### 5. `backend/routes/admin.routes.js`
- **New Routes**:
  - `PUT /users/:id/ban` - Toggle user ban status
  - `GET /spam-posts` - Get all spam posts
  - `GET /users/:userId/spam-posts` - Get spam posts by user

### 6. `backend/package.json`
- **Added Dependency**: `axios` for API calls

### 7. `frontend/src/services/authService.js`
- **Added Methods**:
  - `getSpamPosts(params)` - Get all spam posts
  - `getUserSpamPosts(userId)` - Get spam posts by user
  - `toggleUserBan(userId, data)` - Ban/unban user

### 8. `frontend/src/components/AdminDashboard.jsx`
- **Added Stats**: Banned users and total spam posts
- **Added Button**: "Spam Management" quick action

### 9. `frontend/src/App.jsx`
- **Added Import**: `AdminSpamManagement`
- **Added Route**: `/admin/spam-management`

### 10. `frontend/src/components/CommentSection.jsx`
- **Added New Comment Form**: Users can now write comments on any post
- **Enhanced UI**: Always-visible comment form with proper validation
- **Login Integration**: Disabled for non-logged-in users

## System Behavior Changes

### Post Creation Flow
1. User submits post
2. Post is **IMMEDIATELY CREATED** and saved to database
3. User receives success response instantly
4. System asynchronously combines title + content + tags for spam check
5. Calls spam detection API in background
6. If spam detected:
    - Post is **AUTOMATICALLY DELETED** from database
    - SpamPost record is saved for admin review
    - User's spam count increments
    - User receives notification about automatic deletion
    - If spam count ≥ 5: User account is automatically banned
    - Admin panel updates with new spam statistics
7. If not spam: Post remains normally

### Comment Creation Flow
1. User submits comment
2. Comment is **IMMEDIATELY CREATED** and saved to database
3. User receives success response instantly
4. System asynchronously checks comment content for spam
5. Calls spam detection API in background
6. If spam detected:
    - Comment is **AUTOMATICALLY DELETED** from database
    - SpamPost record is saved with type 'comment' for admin review
    - User's spam count increments
    - User receives notification about automatic deletion
    - If spam count ≥ 5: User account is automatically banned
    - Admin panel updates with new spam statistics
7. If not spam: Comment remains normally

### Admin Features
- **Dashboard**: Shows banned users count and total spam posts
- **User Management**: Users list includes spam post count
- **Spam Management**: View all spam posts, filter by user
- **Manual Controls**: Admins can ban/unban users manually

### Notifications
- **Spam Detection**: Users notified when post is detected as spam
- **Account Ban**: Users notified when account is banned due to spam
- **Admin Actions**: Notifications for manual admin bans/unbans

## API Endpoints Added
- `GET /api/admin/spam-posts` - List all spam posts with pagination and search
- `GET /api/admin/users/:userId/spam-posts` - List spam posts by specific user
- `PUT /api/admin/users/:id/ban` - Ban/unban user with notifications

## Frontend Routes Added
- `/admin/spam-management` - Admin spam management interface

## Database Changes
- New collection: `spamposts`
- User collection: Added `spamPostCount`, `isBanned`, `bannedReason`, `bannedAt` fields

## Security Considerations
- Spam detection happens server-side asynchronously after post creation for optimal performance
- Failed API calls default to allowing posts (fail-safe)
- Admin-only access to spam management endpoints
- User notifications for all actions

## Performance Optimizations
- **Asynchronous Spam Detection**: Posts and comments are created immediately, then checked for spam in the background
- **Non-blocking API Calls**: External spam detection API calls don't delay user responses
- **Fail-safe Design**: If spam detection fails, content remains published
- **Background Processing**: Spam deletion and user notifications happen asynchronously

## Testing Recommendations
1. Test spam detection with various content types
2. Verify user banning after 5 spam posts
3. Check admin dashboard statistics
4. Test notification system
5. Verify API error handling

## Future Enhancements
- Add spam confidence thresholds
- Implement spam post recovery for false positives
- Add community-specific spam rules
- Implement spam reporting by users
- Add analytics for spam detection accuracy

## Admin Features Summary
- **Dashboard Statistics**: Banned users and total spam posts counts
- **Spam Management Page**: Complete interface for viewing and managing auto-detected spam
- **User Investigation**: Click usernames to see detailed spam history
- **Manual Ban/Unban**: Direct user management from spam interface
- **Real-time Updates**: Statistics and user status updates
- **Search & Filter**: Find specific spam posts quickly
- **Pagination**: Handle large volumes of spam data

## User Experience
- **Automatic Notifications**: Users are notified when posts are detected as spam
- **Account Protection**: Automatic banning after 5+ spam posts
- **Transparent Process**: Clear reasons provided for spam detection
- **Admin Communication**: Notifications for manual admin actions