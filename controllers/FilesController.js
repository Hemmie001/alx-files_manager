// controllers/FilesController.js

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const mime = require('mime-types');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const User = require('../models/User'); // Add the file extension if needed
const File = require('../models/File'); // Add the file extension if needed

class FilesController {
    static async postUpload(req, res) {
        const token = req.headers['x-token'];
        if (!token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const userId = await redisClient.get(`auth_${token}`);
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { name, type, parentId = 0, isPublic = false, data } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Missing name' });
        }

        if (!type || !['folder', 'file', 'image'].includes(type)) {
            return res.status(400).json({ error: 'Missing type' });
        }

        if (type !== 'folder' && !data) {
            return res.status(400).json({ error: 'Missing data' });
        }

        let parentFile = null;
        if (parentId !== 0) {
            parentFile = await dbClient.getCollection('files').findOne({ _id: new ObjectId(parentId) });
            if (!parentFile) {
                return res.status(400).json({ error: 'Parent not found' });
            }
            if (parentFile.type !== 'folder') {
                return res.status(400).json({ error: 'Parent is not a folder' });
            }
        }

        const user = await dbClient.getCollection('users').findOne({ _id: new ObjectId(userId) }, { projection: { email: 1 } });
        if (!user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const newFile = {
            userId: new ObjectId(userId),
            name,
            type,
            isPublic,
            parentId: parentFile ? parentFile._id : 0,
        };

        if (type === 'folder') {
            await dbClient.getCollection('files').insertOne(newFile);
            return res.status(201).json(newFile);
        }

        const folderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        const localPath = path.join(folderPath, uuidv4());
        const fileData = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, fileData);

        newFile.localPath = localPath;

        await dbClient.getCollection('files').insertOne(newFile);
        return res.status(201).json(newFile);
    }
}

module.exports = FilesController;
