// src/utils/redis.js

const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();
    this.connected = false;

    this.client.on('error', (err) => {
      console.error('Redis client error:', err);
    });

    this.client.on('connect', () => {
      console.log('Redis client connected');
      this.connected = true;
      if (this.connectResolve) {
        this.connectResolve();
      }
    });

    this.client.on('end', () => {
      console.log('Redis client disconnected');
      this.connected = false;
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);

    this.connectPromise = new Promise((resolve) => {
      if (this.connected) {
        resolve();
      } else {
        this.connectResolve = resolve;
      }
    });
  }

  async ensureConnected() {
    if (!this.connected) {
      await this.connectPromise;
    }
  }

  async isAlive() {
    await this.ensureConnected();
    return this.connected;
  }

  async get(key) {
    await this.ensureConnected();
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (err) {
      console.error(`Error getting value from Redis for key ${key}:`, err);
      return null;
    }
  }

  async set(key, value, duration) {
    await this.ensureConnected();
    try {
      await this.setAsync(key, value, 'EX', duration);
    } catch (err) {
      console.error(`Error setting value in Redis for key ${key} with duration ${duration}:`, err);
    }
  }

  async del(key) {
    await this.ensureConnected();
    try {
      await this.delAsync(key);
    } catch (err) {
      console.error(`Error deleting value in Redis for key ${key}:`, err);
    }
  }

  // Add any additional methods you need to interact with Redis here
}

const redisClient = new RedisClient();
module.exports = redisClient;
