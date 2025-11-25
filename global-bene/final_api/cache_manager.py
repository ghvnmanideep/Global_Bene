

import redis
import json
import logging
from config import REDIS_HOST, REDIS_PORT, REDIS_DB, REDIS_TTL

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self):
        try:
            self.redis_client = redis.Redis(
                host=REDIS_HOST,
                port=REDIS_PORT,
                db=REDIS_DB,
                decode_responses=True
            )
            self.redis_client.ping()
            logger.info(f"✓ Connected to Redis ({REDIS_HOST}:{REDIS_PORT})")
        except Exception as e:
            logger.error(f"✗ Redis connection failed: {e}")
            raise
    
    def cache_recommendations(self, user_id, recommendations):
        try:
            key = f"recommendations:{user_id}"
            value = json.dumps(recommendations)
            self.redis_client.setex(key, REDIS_TTL, value)
            logger.info(f"Cached {len(recommendations)} recommendations for {user_id}")
        except Exception as e:
            logger.error(f"Error caching: {e}")
    
    def get_cached_recommendations(self, user_id):
        try:
            key = f"recommendations:{user_id}"
            cached = self.redis_client.get(key)
            if cached:
                return json.loads(cached)
            return None
        except Exception as e:
            logger.error(f"Error retrieving cache: {e}")
            return None
    
    def clear_all_cache(self):
        try:
            self.redis_client.flushdb()
            logger.info("✓ Cache cleared")
            return True
        except Exception as e:
            logger.error(f"Error clearing cache: {e}")
            return False
    
    def get_cache_stats(self):
        try:
            info = self.redis_client.info()
            keys = len(self.redis_client.keys("recommendations:*"))
            return {
                'cached_users': keys,
                'total_memory_bytes': info.get('used_memory', 0),
                'ttl_seconds': REDIS_TTL
            }
        except Exception as e:
            logger.error(f"Error getting stats: {e}")
            return {}

_cache = None

def get_cache_manager():
    global _cache
    if _cache is None:
        _cache = CacheManager()
    return _cache
