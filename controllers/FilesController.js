// controllers/FilesController.js

const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');
const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');
const File = require('../utils/File'); // Assuming this is your file model

class FilesController {
  static async postUpload(req, res) {
    // Existing code
  }

  static async getShow(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const file = await dbClient.getCollection('files').findOne({ _id: new ObjectId(id) });

    if (!file) {
      return res.status(404).json({ error: 'Not found' });
    }

    if (file.userId.toString() !== userId && !file.isPublic) {
      return res.status(404).json({ error: 'Not found' });
    }

    return res.status(200).json(file);
  }

  static async getIndex(req, res) {
    const token = req.headers['x-token'];
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userId = await redisClient.get(`auth_${token}`);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId = 0, page = 0 } = req.query;
    const query = { userId: new ObjectId(userId) };
    
    if (parentId !== 0) {
      query.parentId = new ObjectId(parentId);
    }

    const files = await dbClient.getCollection('files')
      .find(query)
      .skip(page * 20)
      .limit(20)
      .toArray();

    return res.status(200).json(files);
  }
}

module.exports = FilesController;
