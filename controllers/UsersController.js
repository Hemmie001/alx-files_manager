// controllers/UsersController.js

const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const crypto = require('crypto');
const { ObjectId } = require('mongodb');

class UsersController {
    static async postNew(req, res) {
        const { email, password } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Missing email' });
        }

        if (!password) {
            return res.status(400).json({ error: 'Missing password' });
        }

        const usersCollection = await dbClient.getCollection('users');
        const existingUser = await usersCollection.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ error: 'Already exist' });
        }

        const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
        const newUser = await usersCollection.insertOne({ email, password: hashedPassword });

        return res.status(201).json({ id: newUser.insertedId, email });
    }

    static async getMe(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const usersCollection = await dbClient.getCollection('users');
        const user = await usersCollection.findOne({ _id: new ObjectId(userId) }, { projection: { email: 1 } });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        return res.status(200).json({ id: userId, email: user.email });
    }
}

module.exports = UsersController;
