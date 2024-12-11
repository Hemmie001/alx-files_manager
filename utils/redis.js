const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
    constructor() {
        this.client = redis.createClient();

        this.client.on('error', (err) => {
            console.error('Redis client error:', err);
        });

        this.client.on('connect', () => {
            console.log('Redis client connected');
        });

        this.client.on('ready', () => {
            console.log('Redis client ready');
            this.connected = true; // Set `connected` to true once the `ready` event is emitted
        });

        this.client.on('end', () => {
            console.log('Redis client disconnected');
            this.connected = false;
        });

        this.connected = false;
        this.getAsync = promisify(this.client.get).bind(this.client);
        this.setAsync = promisify(this.client.set).bind(this.client);
        this.delAsync = promisify(this.client.del).bind(this.client);
    }

    isAlive() {
        return this.connected;
    }

    async get(key) {
        try {
            const value = await this.getAsync(key);
            return value;
        } catch (err) {
            console.error(`Error getting value from Redis for key ${key}:`, err);
            return null;
        }
    }

    async set(key, value, duration) {
        try {
            await this.setAsync(key, value, 'EX', duration);
        } catch (err) {
            console.error(`Error setting value in Redis for key ${key} with duration ${duration}:`, err);
        }
    }

    async del(key) {
        try {
            await this.delAsync(key);
        } catch (err) {
            console.error(`Error deleting value in Redis for key ${key}:`, err);
        }
    }
}

const redisClient = new RedisClient();
module.exports = redisClient;
