// controllers/FilesController.js

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const User = require('../utils/User'); // Ensure this path is correct
const File = require('../utils/File'); // Ensure this path is correct

// File storage directory
const UPLOAD_DIR = process.env.FOLDER_PATH || path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

class FilesController {
  static async postUpload(req, res) {
    try {
      // Get the authorization token from the request headers
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      const token = authHeader.split(' ')[1];

      // Verify and decode the token to get the user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await dbClient.getCollection('users').findOne({ _id: new ObjectId(decoded.userId) });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the file data from the request body
      const {
        name, type, parentId = '0', isPublic = false, data,
      } = req.body;

      // Validate the file data
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !['folder', 'file', 'image'].includes(type)) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if (type !== 'folder' && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // Check if the parent folder exists
      let parentFile = null;
      if (parentId !== '0') {
        parentFile = await dbClient.getCollection('files').findOne({ _id: new ObjectId(parentId) });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Process the file based on the type
      if (type === 'folder') {
        // Create a new folder in the database
        const newFile = await dbClient.getCollection('files').insertOne({
          name,
          type,
          parentId,
          isPublic,
          userId: user._id,
          createdAt: new Date(),
        });

        return res.status(201).json(newFile.ops[0]);
      }

      // Generate a unique filename
      const filename = `${uuidv4()}-${name}`;
      const filePath = path.join(UPLOAD_DIR, filename);

      // Save the file on disk
      const fileContent = Buffer.from(data, 'base64');
      await fs.promises.writeFile(filePath, fileContent);

      // Create the file record in the database
      const fileRecord = {
        name,
        type,
        parentId,
        isPublic,
        localPath: filePath,
        userId: user._id,
        createdAt: new Date(),
      };

      const newFile = await dbClient.getCollection('files').insertOne(fileRecord);

      return res.status(201).json(newFile.ops[0]);
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Error uploading file' });
    }
  }
}

module.exports = FilesController;
