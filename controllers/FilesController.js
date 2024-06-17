// controllers/FilesController.js

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const File = require('../models/File');

// File storage directory
const UPLOAD_DIR = process.env.FOLDER_PATH || path.join(__dirname, '../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR);
}

class FilesController {
  static async postUpload(req, res) {
    try {
      // Get the authorization token from the request headers
      let token;
      if (req.headers.authorization) {
        token = req.headers.authorization.split(' ')[1];
      } else {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Verify and decode the token to get the user
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Get the file data from the request body
      const { name, type, parentId = '0', isPublic = false, data } = req.body;

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
      let parentFile;
      if (parentId !== '0') {
        parentFile = await File.findById(parentId);

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
        const newFile = await File.create({
          name,
          type,
          parentId,
          isPublic,
          user: user._id,
          createdAt: new Date(),
        });

        return res.status(201).json(newFile);
      } else {
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
          user: user._id,
          createdAt: new Date(),
        };

        const newFile = await File.create(fileRecord);

        return res.status(201).json(newFile);
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      return res.status(500).json({ error: 'Error uploading file' });
    }
  }
}

module.exports = FilesController;
