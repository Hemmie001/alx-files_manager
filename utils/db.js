// utils/db.js

const { MongoClient } = require('mongodb');

class DBClient {
    constructor() {
        const host = process.env.DB_HOST || 'localhost';
        const port = process.env.DB_PORT || '27017';
        const database = process.env.DB_DATABASE || 'files_manager';

        const url = `mongodb://${host}:${port}`;
        this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
        this.connected = false;

        this.client.connect()
            .then(() => {
                console.log('Connected successfully to MongoDB server');
                this.db = this.client.db(database);
                this.connected = true;
            })
            .catch((err) => {
                console.error('MongoDB connection error:', err);
                this.connected = false;
            });
    }

    isAlive() {
        return this.connected;
    }

    async getCollection(collectionName) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }
        return this.db.collection(collectionName);
    }

    async nbUsers() {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            const usersCollection = await this.getCollection('users');
            const count = await usersCollection.countDocuments();
            return count;
        } catch (err) {
            console.error('Error getting user count:', err);
            return 0;
        }
    }

    async nbFiles() {
        if (!this.connected) {
            throw new Error('Database not connected');
        }

        try {
            const filesCollection = await this.getCollection('files');
            const count = await filesCollection.countDocuments();
            return count;
        } catch (err) {
            console.error('Error getting file count:', err);
            return 0;
        }
    }
}

const dbClient = new DBClient();
module.exports = dbClient;
