// utils/File.js

const { ObjectId } = require('mongodb');
const dbClient = require('./db');

class File {
  static async findById(id) {
    if (!ObjectId.isValid(id)) {
      return null;
    }
    return dbClient.getCollection('files').findOne({ _id: new ObjectId(id) });
  }

  static async create(fileData) {
    const result = await dbClient.getCollection('files').insertOne(fileData);
    return result;
  }
}

module.exports = File;
