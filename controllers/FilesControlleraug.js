// controllers/FilesController.js

const { ObjectId } = require('mongodb');
const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

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

    const {
      name, type, parentId = 0, isPublic = false, data,
    } = req.body;

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

    const user = await dbClient.getCollection('users').findOne({ _id: new ObjectId(userId) });
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

    // File saving logic

    return res.status(201).json({ message: 'File uploaded' });
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
