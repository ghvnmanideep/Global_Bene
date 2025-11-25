# Advanced Recommendation API Integration

## Overview

Integrated an advanced ML-based recommendation system from the GitHub repository (https://github.com/GNCIPL-PROJECT-2025/global_bene/tree/final_api) into the current project. The system provides sophisticated post recommendations using hybrid algorithms combining collaborative filtering, content-based filtering, and heuristics.

## Key Features Added

### 1. Advanced Recommendation Engine
- **Hybrid Algorithm**: Combines collaborative filtering (user similarity), content-based (tags/topics), and heuristic-based (community match, popularity) recommendations
- **Cold-Start Handling**: Special logic for new users with no interaction history
- **Caching**: Redis-based caching for faster response times
- **Background Processing**: Asynchronous recommendation generation for better performance

### 2. Technical Architecture
- **Separate Python Service**: FastAPI-based recommendation API running on port 8000
- **Database Adaptation**: Modified to work with existing MongoDB schema and UserInteractionLog collection
- **Fallback Mechanism**: If advanced API is unavailable, falls back to existing rule-based recommendations

## Files Added/Modified

### New Files
- `final_api/main_api.py` - FastAPI server for recommendations
- `final_api/topk_hybrid_advanced.py` - Core recommendation logic
- `final_api/database.py` - MongoDB connection and data loading (adapted)
- `final_api/config.py` - Configuration settings
- `final_api/.env` - Environment variables
- `final_api/requirements.txt` - Python dependencies

### Modified Files
- `backend/controllers/recommendation.controller.js` - Added call to Python API with fallback
- `final_api/database.py` - Adapted get_users to compute num_posts, num_comments, communities_followed
- `final_api/topk_hybrid_advanced.py` - Modified _load_votes_df to use UserInteractionLog

## Algorithm Details

### Recommendation Strategies
1. **Cache Check**: Return cached recommendations if available
2. **Cold-Start Detection**: For users with no votes, use heuristic scoring
3. **Collaborative Filtering**: Find similar users based on voting patterns
4. **Hybrid Scoring**: Combine multiple signals for final ranking

### Data Sources
- **Posts**: title, content, tags, topics, community, score, status
- **Users**: interaction counts, community memberships, interests
- **Votes**: From UserInteractionLog (vote_post_up/down actions)
- **Communities**: Membership from interaction logs

## API Endpoints

### Existing (Enhanced)
- `GET /api/recommendations/users/:userId/posts` - Now uses advanced ML when available

### New Python API
- `GET /recommendations/{user_id}` - Get recommendations
- `POST /recommendations/refresh/{user_id}` - Manual refresh

## Benefits

- **Improved Personalization**: More accurate recommendations based on user behavior
- **Scalability**: Handles large datasets with FAISS indexing
- **Flexibility**: Multiple algorithms for different scenarios
- **Performance**: Caching and background processing
- **Fallback Safety**: Graceful degradation to rule-based system

## Setup Instructions

1. Install Python dependencies: `pip install -r final_api/requirements.txt`
2. Set environment variables in `final_api/.env`
3. Run the recommendation service: `python final_api/main_api.py`
4. Start the main backend as usual

## Future Enhancements

- Community recommendations using similar algorithms
- User-to-user recommendations
- Real-time recommendation updates
- A/B testing framework
- Model training pipeline

## Dependencies

- Python 3.8+
- MongoDB
- Redis (optional, for caching)
- ML libraries: scikit-learn, sentence-transformers, FAISS