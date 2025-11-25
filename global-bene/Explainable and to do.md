The recommendation system in Global Bene is designed not as a full AI engine, but as a data collection layer to log user interactions for future AI-driven recommendations.

⚙️ Main Implementation Steps

1️⃣ Interaction Schema:

Created a UserInteractionLog model to record user actions (e.g., view_post, like_post, join_community).

Fields include: userId, action, targetType, targetId, metadata, timestamps, and a 90-day TTL for auto-expiry.

2️⃣ Logging Utilities:

Developed interactionLogger.js with reusable async functions:
logPostView, logLike, logComment, logFollow, logSearch, etc.

Logs are stored non-blocking to maintain app performance.

3️⃣ Controller Integration:

Logging integrated into core controllers:

Post views → getPostById

Likes, saves, comments, votes → corresponding endpoints

Each log stores contextual metadata (post type, category, community).

4️⃣ Admin Access for AI Team:

Created recommendation.controller.js with endpoints:

getInteractionLogs (paginated/filterable, CSV export)

getUserInteractionLogs (user-specific)

getInteractionStats (aggregated engagement insights)

5️⃣ Security & Routing:

All recommendation routes are admin-only and authenticated via middleware.




https://globalbene-api-latest.onrender.com/docs#/default/get_personalized_feed_feed_post