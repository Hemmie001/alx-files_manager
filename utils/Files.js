// utils/File.js

const { ObjectId } = require('mongodb');
const dbClient = require('./db');

class File {
  static async findById(fileId) {
    return dbClient.getCollection('files').findOne({ _id: new ObjectId(fileId) });
  }

  static async create(fileData) {
    return dbClient.getCollection('files').insertOne(fileData);
  }
}

module.exports = File;
