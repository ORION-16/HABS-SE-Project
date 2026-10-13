const Redis = require('ioredis');

let redis;

try {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn('⚠️  Redis connection failed — running without cache/blacklist');
        return null; // stop retrying
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
  });

  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (err) => {
    console.warn(`⚠️  Redis error: ${err.message}`);
  });
} catch (err) {
  console.warn('⚠️  Redis unavailable — running without cache/blacklist');
  redis = null;
}

module.exports = redis;
